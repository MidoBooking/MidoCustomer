import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import fbConfig from "../../firebase";
import { useNavigation } from "@react-navigation/native";
import COLORS from "../../consts/colors";

try {
  initializeApp(fbConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const auth = getAuth();

const LoginByPhoneNumber = () => {
  const [selectedCountry, setSelectedCountry] = useState("+251");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationID] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [info, setInfo] = useState("");

  const navigation = useNavigation();
  const recaptchaVerifier = useRef(null);

  const attemptInvisibleVerification = false;

  const handleSendVerificationCode = async () => {
    try {
      const fullPhoneNumber = selectedCountry + phoneNumber;

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current
      );
      setVerificationID(verificationId);
      setInfo("Verification code has been sent to your phone");
    } catch (error) {
      setInfo(`Error: ${error.message}`);
    }
  };

  const handleVerifyVerificationCode = async () => {
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );

      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log(user.uid);
      setInfo("Success: Phone authentication successful");
      navigation.navigate("Home"); // Change "Home" to the appropriate screen name.
    } catch (error) {
      setInfo(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={fbConfig}
      />
      <Image
        source={require("../../assets/bafta_logo.png")}
        style={styles.logo}
      />
      {info && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      )}
      {!verificationId ? (
        <View>
          <Text style={styles.headerText}>Login with Phone Number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.countryCodeText}>{selectedCountry}</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              onChangeText={(text) => setPhoneNumber(text)}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendVerificationCode}
            disabled={!phoneNumber}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.subHeaderText}>Enter the Verification Code</Text>
          <TextInput
            style={styles.verificationCodeInput}
            editable={!!verificationId}
            placeholder="123456"
            onChangeText={setVerificationCode}
          />
          <TouchableOpacity
            style={styles.button}
            disabled={!verificationCode}
            onPress={handleVerifyVerificationCode}
          >
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      )}
      {attemptInvisibleVerification && <FirebaseRecaptchaBanner />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    marginBottom: 80,
  },
  headerText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  subHeaderText: {
    color: COLORS.primary,
    fontSize: 18,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    borderColor: COLORS.primary,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  countryCodeText: {
    marginRight: 5,
    fontSize: 20,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  verificationCodeInput: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  infoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  infoText: {
    color: "black",
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
});

export default LoginByPhoneNumber;
