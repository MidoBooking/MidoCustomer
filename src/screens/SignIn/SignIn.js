import React, { useState, useRef, useEffect } from "react";
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
import COLORS from "../../consts/colors";
import { connect } from "react-redux";
import { setUserId } from "../../redux/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDocs, collection, query, where } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

try {
  initializeApp(fbConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const auth = getAuth();
const firestore = getFirestore();

const LoginByPhoneNumber = ({ setUserId, navigation }) => {
  const [selectedCountry, setSelectedCountry] = useState("+251");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationID] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [info, setInfo] = useState("");

  const recaptchaVerifier = useRef(null);

  const attemptInvisibleVerification = false;

  const handleSendVerificationCode = async () => {
    try {
      const fullPhoneNumber = selectedCountry + phoneNumber;

      // Check if the user exists before sending OTP
      const userRecord = await getUserRecord(fullPhoneNumber);
      if (userRecord) {
        const phoneProvider = new PhoneAuthProvider(auth);

        const verificationId = await phoneProvider.verifyPhoneNumber(
          fullPhoneNumber,
          recaptchaVerifier.current
        );

        setVerificationID(verificationId);
        setInfo("Verification code has been sent to your phone");
      } else {
        setInfo("Error: User not found in the database");
        console.error("User not found in the database");

        // Navigate to the "RegisterbyPhoneNumber" screen
        navigation.navigate("RegisterbyPhoneNumber");
      }
    } catch (error) {
      setInfo(`Error: ${error.message}`);
    }
  };

  const getUserRecord = async (phoneNumber) => {
    try {
      const userRecord = await fetchUserRecordFromDatabase(phoneNumber);
      return userRecord;
    } catch (error) {
      console.error("Error fetching user record:", error);
      return null;
    }
  };

  const yourDatabaseQueryFunction = async (phoneNumber) => {
    const usersCollection = collection(firestore, "Clients");
    const q = query(usersCollection, where("phoneNumber", "==", phoneNumber));

    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userRecord = querySnapshot.docs[0].data();
        return userRecord;
      } else {
        return null; // User not found
      }
    } catch (error) {
      console.error("Error fetching user record:", error);
      return null;
    }
  };

  const fetchUserRecordFromDatabase = async (phoneNumber) => {
    console.log("Fetching user record for phone number:", phoneNumber);
    try {
      const userRecord = await yourDatabaseQueryFunction(phoneNumber);
      console.log("User record found:", userRecord);
      return userRecord;
    } catch (error) {
      console.error("Error fetching user record:", error);
      return null;
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
      // Save the user's ID in AsyncStorage
      await AsyncStorage.setItem("userId", user.uid);
      if (user) {
        setInfo("Success: Phone authentication successful");

        // Check 'aboutYouSet' in Firestore
        const userRecord = await fetchUserRecordFromDatabase(
          selectedCountry + phoneNumber
        );
        const aboutYouSet = userRecord ? userRecord.aboutYouSet : false;

        if (aboutYouSet) {
          // User has completed 'AboutYou' section
          setUserId(user.uid);
          navigation.navigate("Main");
        } else {
          // User needs to complete 'AboutYou' section
          setUserId(user.uid);
          navigation.navigate("AboutYou");
        }
      } else {
        setInfo("Error: User not found in the database");
        console.error("User not found in the database");

        navigation.navigate("RegisterbyPhoneNumber");
      }
    } catch (error) {
      setInfo(`Error: ${error.message}`);
    }
  };

  const notRegistered = () => {
    navigation.navigate("RegisterbyPhoneNumber");
  };

  useEffect(() => {
    // Check if the userId is saved locally in AsyncStorage
    AsyncStorage.getItem("userId").then((userId) => {
      if (userId) {
        setUserId(userId);
        navigation.navigate("Main");
      }
    });
  }, [setUserId, navigation]);

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
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>
          <View
            style={{ flexDirection: "row", marginTop: 20, alignSelf: "center" }}
          >
            <Text style={styles.registerText}> Not registered yet? </Text>
            <TouchableOpacity onPress={notRegistered}>
              <Text style={styles.registerLink}>Register here</Text>
            </TouchableOpacity>
          </View>
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
    width: 150,
    height: 150,
    marginBottom: 20,
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
  registerLink: {
    color: "#003f5c",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerText: {
    color: "black",
    fontSize: 16,
  },
});

const mapDispatchToProps = (dispatch) => {
  return {
    setUserId: (userId) => dispatch(setUserId(userId)),
  };
};

export default connect(null, mapDispatchToProps)(LoginByPhoneNumber);
