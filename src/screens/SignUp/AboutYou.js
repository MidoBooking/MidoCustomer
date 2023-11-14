import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import useInternetConnectivity from "../../components/useInternetConnectivity";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import Modal from "react-native-modal"; // Import the react-native-modal library
import COLORS from "../../consts/colors";

function AboutYou() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState(""); // New input for gender
  const navigation = useNavigation();

  const userId = useSelector((state) => state.user.userId);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPickerShow, setIsPickerShow] = useState(false);
  const [dateOfBirth, setdateOfBirth] = useState(new Date());
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false); // State for gender selection modal
  //format date
  const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
  };

  const showGenderModal = () => {
    setIsGenderModalVisible(true);
  };

  const hideGenderModal = () => {
    setIsGenderModalVisible(false);
  };

  const selectGender = (selectedGender) => {
    setGender(selectedGender);
    hideGenderModal();
  };

  const showPicker = () => {
    setIsPickerShow(true);
  };

  const onChange = (event, value) => {
    if (value !== undefined) {
      setdateOfBirth(value); // Set the dateOfBirth state to a Date object
    }
    if (Platform.OS === "android") {
      setIsPickerShow(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !gender || !dateOfBirth) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    const formattedDateOfBirth = `${(dateOfBirth.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${dateOfBirth
      .getDate()
      .toString()
      .padStart(2, "0")}/${dateOfBirth.getFullYear()}`;

    console.log(name, gender, formattedDateOfBirth);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const location = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      };

      // Make a POST request to your Express.js API to store user information
      const response = await fetch(
        `http://192.168.0.8:3001/register/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            gender,
            dateOfBirth: formattedDateOfBirth,
            location,
          }),
        }
      );

      if (response.status === 200) {
        console.log("User information stored successfully");
        navigation.navigate("Home");
      } else {
        console.error("Failed to store user information");
        // Handle the failure case, e.g., show an error message to the user
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity onPress={showGenderModal} style={styles.input}>
        {gender ? (
          <Text>{gender}</Text>
        ) : (
          <Text style={styles.placeholderText}>Select Gender</Text>
        )}
      </TouchableOpacity>
      {/* The gender selection modal */}
      <Modal
        isVisible={isGenderModalVisible}
        onBackdropPress={hideGenderModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropTransitionOutTiming={0}
        backdropTransitionInTiming={0}
      >
        <View style={styles.genderModalContainer}>
          <Text style={styles.genderModalTitle}>Select Gender</Text>
          <TouchableOpacity
            onPress={() => selectGender("male")}
            style={styles.genderOption}
          >
            <Text>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => selectGender("female")}
            style={styles.genderOption}
          >
            <Text>Female</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {!isPickerShow && (
        <View style={styles.btnContainer}>
          <TouchableOpacity
            onPress={showPicker}
            style={styles.selectDateButton}
          >
            <Text style={styles.selectDateButtonText}>
              {dateOfBirth.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* The date picker */}
      {isPickerShow && (
        <DateTimePicker
          value={dateOfBirth}
          mode={"date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour={true}
          onChange={onChange}
          style={styles.datePicker}
        />
      )}

      <TouchableOpacity onPress={handleRegister} style={styles.RegisterBtn}>
        <Text style={styles.RegisterText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 170,
    height: 170,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 12,
    marginVertical: 8,
    alignSelf: "center",
    width: "80%",
  },
  error: {
    color: "red",
    marginBottom: 8,
  },
  alreadyRegisteredText: {
    color: "black",
    fontSize: 19,
  },
  noteRegisteredLink: {
    color: "#003f5c",
    fontWeight: "bold",
    fontSize: 19,
  },
  RegisterBtn: {
    width: "100%",
    backgroundColor: "#069BA4",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  RegisterText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickedDateContainer: {
    padding: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  pickedDate: {
    fontSize: 18,
    color: "black",
  },
  btnContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 12,
    marginVertical: 8,
    alignSelf: "center",
    width: "80%",
  },
  // This only works on iOS
  datePicker: {
    width: 320,
    height: 260,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    color: COLORS.dark,
  },
  genderModalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  genderModalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  genderOption: {
    padding: 10,
  },
  genderModalCloseButton: {
    marginTop: 10,
  },
  placeholderText: {
    color: "#777",
  },
});

export default AboutYou;
