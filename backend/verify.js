// following steps should be performed
// 1. decode the jws
// 2. verify the source of the first certificate in x5c array of jws header
//    to be attest.google.com
// 3. now to be sure if the jws was not tampered with, validate the signature of jws
//    with the certificate whose source we validated
// 4. if the signature was valid, we need to know if the certificate was valid by
//    explicitly checking the certificate chain
// 5. Validate the payload by matching the package name, apkCertificateDigest(base64 encoding of hashed your apps signing certificate)
//    and nonce value
// 6. and now you can trust the ctsProfileMatch and BasicIntegrity flags
// let's see some code in node, though this will not run as-is,
// but it provides an outline on how to do it and which functions to consider
const router = require("express").Router();
const pki = require("node-forge").pki;
const jws = require("jws");
const pem = require("pem");
const forge = require("node-forge");
let fs = require("fs");

const signedAttestation = "Your signed attestation here";
function doTheReformatting(x5cArray) {
  //check if x5carray[i]>0 length --todo
  let arr = [];
  for (let i = 0; i < x5cArray.length; i++) {
    let j = 0;
    let str2 = x5cArray[i];
    while (j < str2.length) {
      if (j % 63 == 0 && j != 0) {
        str2 = str2.slice(0, j) + "\n" + str2.slice(j); //inefficient??
      }
      j = j + 1;
    }
    if (str2.charAt(str2.length - 1) != "\n") str2 = str2 + "\n";
    let str1 =
      "-----BEGIN CERTIFICATE-----\n" + str2 + "-----END CERTIFICATE-----";
    arr.push(str1);
  }
  return arr;
}
function deviceAttestationCheck(signedAttestation) {
  // 1. decode the jws
  const decodedJws = jws.decode(signedAttestation);
  console.log(decodedJws);
  //const payload = JSON.parse(decodedJws.payload);

  // convert the certificate received in the s5c array into valid certificates by adding
  // '-----BEGIN CERTIFICATE-----\n' and '-----END CERTIFICATE-----'
  // at the start and the end respectively for each element in the array
  // and by adding '\n' at every 64 char
  // you'll have to write your own function to do the simple string conversion
  // get the x5c certificate array
  const x5cArray = decodedJws.header.x5c;
  updatedX5cArray = doTheReformatting(x5cArray);

  // 2. verify the source to be attest.google.com
  certToVerify = updatedX5cArray[0];
  const details = pem.readCertificateInfo(certToVerify, (err, result) => {
    console.log("err", err);
    console.log("res", result);
  });
  //if (details.commanName !== "attest.google.com") return false;

  const certs = updatedX5cArray.map((cert) => pki.certificateFromPem(cert));

  // 3. Verify the signature with the certificate that we received
  // the first element of the certificate(certs array) is the one that was issued to us, so we should use that to verify the signature
  //console.log(updatedX5cArray[0]);
  const isSignatureValid = jws.verify(
    signedAttestation,
    "RS256",
    updatedX5cArray[0]
  );
  let gsr2 = fs.readFileSync("./gsr2.pem").toString();
  console.log(gsr2);
  ///const gsr2Reformatted = gsr2;
  //const rootCert = pki.certificateFromPem(gsr2Reformatted[0]);
  const caStore = pki.createCaStore([gsr2]);
  //console.log(caStore.payload)

  //TODO : IMPPPPP NOTE: this pki implementation does not check for certificate revocation list, which is something that you'll need to do separately
  let isChainValid;
  try {
    isChainValid = pki.verifyCertificateChain(caStore, certs);
  } catch (err) {
    isChainValid = false;
    console.log(err);
  }
  console.log("isChainValid", isChainValid);
  return isChainValid;
}

router.post("/one", async (req, res) => {
  //const val = new Joi.ValidationError(req.body, schema);
  //console.log(req.body);

  res.send(deviceAttestationCheck(req.body.signedAttestation));
});
module.exports = router;
