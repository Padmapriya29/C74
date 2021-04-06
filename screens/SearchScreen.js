import React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import db from "../config";
export default class SearchScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allTransactions: [],
      lastVisibleTransaction: null,
      search: "",
    };
  }

  componentDidMount = async () => {
    const query = await db.collection("transactions").limit(10).get();

    query.docs.map((doc) => {
      this.setState({
        allTransactions: [],
        lastVisibleTransaction: doc,
      });
    });
  };

  searchTransactions = async (text) => {
    this.setState({ allTransactions: [] });
    if (text.length > 0) {
      var enteredText = text.split("");
      var text = text.toUpperCase();

      if (enteredText[0].toUpperCase() === "B") {
        const transaction = await db
          .collection("transactions")
          .where("bookID", "==", text)
          .get();
        transaction.docs.map((doc) => {
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc,
          });
        });
      } else if (enteredText[0].toUpperCase() === "S") {
        const transaction = await db
          .collection("transactions")
          .where("studentID", "==", text)
          .get();
        transaction.docs.map((doc) => {
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc,
          });
        });
      }
    }
  };

  fetchMoreTransactions = async () => {
    if (this.state.search.length > 0) {
      var text = this.state.search.toUpperCase();
      var enteredText = text.split("");
      if (enteredText[0].toUpperCase() === "B") {
        const query = await db
          .collection("transactions")
          .where("bookId", "==", text)
          .startAfter(this.state.lastVisibleTransaction)
          .limit(10)
          .get();
        query.docs.map((doc) => {
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc,
          });
        });
      } else if (enteredText[0].toUpperCase() === "S") {
        const query = await db
          .collection("transactions")
          .where("studentId", "==", text)
          .startAfter(this.state.lastVisibleTransaction)
          .limit(10)
          .get();
        query.docs.map((doc) => {
          this.setState({
            allTransactions: [...this.state.allTransactions, doc.data()],
            lastVisibleTransaction: doc,
          });
        });
      }
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.bar}
            placeholder="Enter Book Id or Student Id"
            onChangeText={(text) => {
              this.setState({ search: text });
            }}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              this.searchTransactions(this.state.search);
            }}
          >
            <Text>Search</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={this.state.allTransactions}
          renderItem={({ item }) => (
            <View style={{ borderBottomWidth: 2, marginTop: 15 }}>
              <Text>{"Book Id: " + item.bookId}</Text>
              <Text>{"Student Id: " + item.studentId}</Text>
              <Text>{"Transaction Type: " + item.transactionType}</Text>
              <Text>{"Date: " + item.date.toDate()}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          onEndReached={this.fetchMoreTransactions}
          onEndReachedThreshold={0.7}
        ></FlatList>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  searchBar: {
    flexDirection: "row",
    height: 40,
    width: "auto",
    borderWidth: 0.5,
    alignItems: "center",
    backgroundColor: "grey",
  },
  bar: {
    borderWidth: 2,
    height: 30,
    width: 300,
    paddingLeft: 10,
  },
  searchButton: {
    borderWidth: 1,
    height: 30,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "green",
  },
});
