import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  ToastAndroid,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import firebase from "firebase";
import db from "../config";
export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermission: null,
      scanned: false,
      scannedBookId: "",
      scannedStudentId: "",
      buttonState: "normal",
    };
  }
  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === "granted",
      buttonState: id,
      scanned: false,
    });
  };
  handleBarCodeScanner = ({ type, data }) => {
    const { buttonState } = this.state;
    if (buttonState === "BookId") {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: "normal",
      });
    } else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: "normal",
      });
    }
  };

  handleTransaction = async () => {
    var transactionType = await this.checkBookEligibilty();
    if (!transactionType) {
      Alert.alert("The book doesn't exist in the library database");
      this.setState({
        scannedStudentId: "",
        scannedBookId: "",
      });
    } else if (transactionType === "Issue") {
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if (isStudentEligible) {
        this.initiateBookIssue();
        Alert.alert("Book issued to the student");
      }
    } else {
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      if (isStudentEligible) {
        this.initiateBookReturn();
        Alert.alert("Book returned to the library");
      }
    }
  };

  checkBookEligibilty = async () => {
    var transactionType = "";
    const bookRef = await db
      .collection("books")
      .where("bookID", "==", this.state.scannedBookId)
      .get();

    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map((doc) => {
        var book = doc.data();
        if (book.bookAvailability) {
          transactionType = "Issue";
        } else {
          transactionType = "Return";
        }
      });
    }
    return transactionType;
  };

  checkStudentEligibilityForBookReturn = async () => {
    var isStudentEligible = null;
    const transactionRef = await db
      .collection("transactions")
      .where("bookID", "==", this.state.scannedBookId)
      .limit(1)
      .get();

    transactionRef.docs.map((doc) => {
      var lastTransaction = doc.data();
      if (lastTransaction.studentID == this.state.scannedStudentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert("The book wasn't issued by this student!");
        this.setState({
          scannedBookId: "",
          scannedStudentId: "",
        });
      }
    });
    return isStudentEligible;
  };

  checkStudentEligibilityForBookIssue = async () => {
    var isStudentEligible = null;
    const studentRef = await db
      .collection("students")
      .where("studentID", "==", this.state.scannedStudentId)
      .get();

    if (studentRef.docs.length == 0) {
      isStudentEligible = false;
      Alert.alert("The student ID doesn't exist in the database!");
      this.setState({
        scannedBookId: "",
        scannedStudentId: "",
      });
    } else {
      studentRef.docs.map((doc) => {
        var student = doc.data();
        if (student.numberOfBooksIssued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          Alert.alert("The student has already issued 2 books!");
          this.setState({
            scannedBookId: "",
            scannedStudentId: "",
          });
        }
      });
    }
    return isStudentEligible;
  };

  initiateBookIssue = async () => {
    db.collection("transactions").add({
      bookID: this.state.scannedBookId,
      studentID: this.state.scannedStudentId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Issue",
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      bookAvailability: false,
    });
    db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(1),
      });
    //Alert.alert("Book Issued");
    ToastAndroid.show("Book Issued", ToastAndroid.LONG);
    this.setState({
      scannedBookId: "",
      scannedStudentId: "",
    });
  };

  initiateBookReturn = async () => {
    db.collection("transactions").add({
      bookID: this.state.scannedBookId,
      studentID: this.state.scannedStudentId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Return",
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      bookAvailability: true,
    });
    db.collection("students")
      .doc(this.state.scannedStudentId)
      .update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(-1),
      });
    //Alert.alert("Book Returned");
    ToastAndroid.show("Book Returned", ToastAndroid.LONG);
    this.setState({
      scannedBookId: "",
      scannedStudentId: "",
    });
  };
  render() {
    const hasCameraPermission = this.state.hasCameraPermission;
    const buttonState = this.state.buttonState;
    const scanned = this.state.scanned;
    if (buttonState !== "normal" && hasCameraPermission) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanner}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <View style={styles.container}>
          <View>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: "center", fontSize: 30 }}>Wily</Text>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "padding"}
              enabled
            >
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Book ID"
                  value={this.state.scannedBookId}
                  onChangeText={(text) => {
                    this.setState({
                      scannedBookId: text,
                    });
                  }}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => {
                    this.getCameraPermissions("BookId");
                  }}
                >
                  <Text style={styles.buttonText}> Scan</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Student ID"
                  value={this.state.scannedStudentId}
                  onChangeText={(text) => {
                    this.setState({
                      scannedStudentId: text,
                    });
                  }}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => {
                    this.getCameraPermissions("StudentId");
                  }}
                >
                  <Text style={styles.buttonText}> Scan</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  this.handleTransaction();
                }}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: "underline",
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10,
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  inputView: {
    flexDirection: "row",
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: "#66BB6A",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  submitButton: {
    backgroundColor: "#fbc020",
    width: 100,
    height: 50,
  },
  submitButtonText: {
    padding: 10,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
});
