import 'package:flutter/material.dart';
import 'package:flutter_safetynet_attestation/flutter_safetynet_attestation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MyApp());
}


class MyApp extends StatelessWidget {
 checkPlay() {
    FlutterSafetynetAttestation.googlePlayServicesAvailability().then((value) => print(value));
    
  }
 getJws()async{
   print("Here");
   var idi = await FlutterSafetynetAttestation.safetyNetAttestationJwt("nonce");
   print(idi.length);
   var url = 'http://192.168.1.4:3002/api/verify/one';
   //String send1 = '{\"email\":\"'+ email+ '\", \"password\":\"'+ password +'\"}';
   //print(send1);
   Map<String, String> requestHeaders = {
     'Content-type': 'application/json'
   };
   var sede = jsonEncode({"signedAttestation":idi});
   var response = await http.post(url,headers: requestHeaders ,body: sede);
   Map<String, dynamic> resp = jsonDecode(response.body);
   print(resp);
   //FlutterSafetynetAttestation.safetyNetAttestationPayload('ff67hgftyj65yhhgt5yg').then((value) => print(value));
 }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'Flutter Demo',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: Scaffold(
          appBar: AppBar(
            title: Text("SafetyNet API Testing"),
          ),
          body: Column(children: [
            Text("Welcome"),
            RaisedButton(
              child: Text("Safetycheck"),
              onPressed: getJws
              )
          ]),
        ));
  }
}
