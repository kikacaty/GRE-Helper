'use strict';

var Button  = require('react-native-button');
var Modal   = require('react-native-modalbox');
var Slider  = require('react-native-slider');
var window  = require('Dimensions').get('window');

let CIRCLE_RADIUS = 45;

import React, { Component } from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableHighlight,
  TextInput,
  ListView,
  DeviceEventEmitter,
  LayoutAnimation,
  Animated,
  PanResponder,
  AlertIOS,
} from 'react-native';

var Firebase = require('firebase');
var screen = require('Dimensions').get('window');

var styles = StyleSheet.create({

  wrapper: {
    paddingTop: 50,
    flex: 1
  },
  counterView:{
    marginTop: 20,
    width: 80,
    height: 80,
    borderColor: '#48afdb',
    borderWidth: 1,
    borderRadius: 80/2,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  counterText:{
    color: '#48afdb',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputcontainer: {
    marginTop: 5,
    padding: 20,
    flexDirection: 'row'
  },
  input: {
    height: 36,
    padding: 4,
    marginRight: 5,
    flex: 4,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#48afdb',
    borderRadius: 4,
    color: '#48BBEC'
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalList: {

  },
  modal4: {
    height: 2*window.height/5,
  },
  modalTest: {
    height: 2*window.height/5,
    flexDirection: 'row',
  },
  btn: {
    margin: 10,
    backgroundColor: "#48afdb",
    borderRadius: 5,
    color: "white",
    padding: 10
  },

  btnModal: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    backgroundColor: "transparent"
  },
  text: {
    color: "black",
    fontSize: 22
  },
  promptText: {
    color: 'black',
    fontSize: 28,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  listWrapper: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    borderRadius: 5,
    paddingTop: 8,
    paddingLeft:20,
    height: 48
  },
  vocText: {
    color: "white",
    justifyContent: 'center',
    fontSize: 22
  },
  circle: {
    backgroundColor     : '#1abc9c',
    width               : CIRCLE_RADIUS*2,
    height              : CIRCLE_RADIUS*2,
    borderRadius        : CIRCLE_RADIUS
  },
  dragText: {
    marginTop   : 36,
    marginLeft  : 5,
    marginRight : 5,
    textAlign   : 'center',
    color       : '#fff'
  },
  draggableContainer: {
    flex: 3,
    alignItems: 'center',
  },
  areaText: {
    fontSize: 28,
    textAlign   : 'center',
    color       : '#fff'
  },
  leftDropArea: {
    flex: 1,
    backgroundColor: 'rgb(225,85,18)',
    height: 2*window.height/5,
    justifyContent: 'center',
  },
  rightDropArea: {
    flex: 1,
    backgroundColor: '#1abc9c',
    height: 2*window.height/5,
    justifyContent: 'center',
  }
});

class greHelper extends Component{
  constructor(props) {
    super(props);

    var myFirebaseRef = new Firebase('https://project-5398597199906665112.firebaseio.com/');

    this.fireRef = myFirebaseRef;
    this.itemsRef = myFirebaseRef.child('items');

    this.state = {
      newVoc: '',
      vocSource: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      vocCount: 0,
      isListOpen: false,
      isTestOpen: false,
      isDisabled: false,
      swipeToClose: true,
      sliderValue: 0.3,

      pan: new Animated.ValueXY(),
      noZoneValues: null,
      yesZoneValues: null,

      testId: 0,
      testWord: '',
    };

    myFirebaseRef.child('count').on('value',  (dataSnapshot) => {this.state.vocCount = dataSnapshot.val()});

    this.items = [];

    this.openModal1.bind(this);

    this.panResponder = PanResponder.create({
        onStartShouldSetPanResponder : () => true,
        onPanResponderMove           : Animated.event([null,{
            dx : this.state.pan.x,
            dy : this.state.pan.y
        }]),
        onPanResponderRelease        : (e, gesture) => {

          if(this.isYesZone(gesture)){
            this.items[this.state.testId].count--;
            if(this.items[this.state.testId].count == 0){
              this.removeVoc(this.items[this.state.testId])
            }
            this.loadWord();
          }
          else if(this.isNoZone(gesture)){
            this.items[this.state.testId].count = 2;
            this.loadWord();
          }

            Animated.spring(
              this.state.pan,
              {toValue:{x:0,y:0}}
          ).start();

        }
    })
    }

  componentWillMount () {
    DeviceEventEmitter.addListener('keyboardWillShow', (e) => {
      // Use e.endCoordinates.height
      // to set your view's marginBottom
      // ...
    });

    DeviceEventEmitter.addListener('keyboardWillHide', (e) => {
      this.addVoc();
    });
  }

  componentDidMount() {
    // When a voc is added
    this.itemsRef.on('child_added', (dataSnapshot) => {
      this.items.push({id: dataSnapshot.key(), text: dataSnapshot.val(), count: 2});
      this.setState({
        vocSource: this.state.vocSource.cloneWithRows(this.items)
      });
    });

    // When a voc is removed
    this.itemsRef.on('child_removed', (dataSnapshot) => {
        this.items = this.items.filter((x) => x.id !== dataSnapshot.key());
        this.setState({
          vocSource: this.state.vocSource.cloneWithRows(this.items)
        });
    });
  }

  addVoc() {
    if (this.state.newVoc !== '') {
      this.itemsRef.push({
        voc: this.state.newVoc
      });
      this.setState({
        newVoc : '',
        vocCount : this.state.vocCount + 1,
      });
      this.fireRef.update({count: this.state.vocCount});
    }
  }

  removeVoc(rowData) {
    this.itemsRef.child(rowData.id).remove();
    this.state.vocCount--;
    this.fireRef.update({count: this.state.vocCount});
  }

  openModal1(id) {
    if(this.state.vocCount == 0) {
      AlertIOS.alert(
            'Empty vocabulary list',
            'No word added to your vocabulary list yet, add it now~'
          )
    }
    else {
      this.setState({isListOpen: true});
      this.refs.modal1.open();
    }
  }

  closeModal1(id) {
    this.setState({isListOpen: false});
  }

  openModal4(id) {

    if (this.items.length == 0){
      AlertIOS.alert(
            'Empty vocabulary list',
            'No word added to your vocabulary list yet, add it now~'
          )
    }
    else {

      this.loadWord();

      this.setState({
        isTestOpen: true,
      });
      this.refs.modal4.open();
    }
  }

  closeModal4(id) {
    this.setState({isTestOpen: false});
  }

  onClose() {
    console.log('Modal just closed');
  }

  onOpen() {
    console.log('Modal just openned');
  }

  setNoZoneValues(event) {
    this.setState({
      noZoneValues: event.nativeEvent.layout
    });
  }
  setYesZoneValues(event) {
    this.setState({
      yesZoneValues: event.nativeEvent.layout
    });
  }

  isNoZone(gesture) {
    var dz = this.state.noZoneValues;
    return gesture.moveX > dz.x && gesture.moveX < dz.x + dz.width;
  }

  isYesZone(gesture) {
    var dz = this.state.yesZoneValues;
    return gesture.moveX > dz.x && gesture.moveX < dz.x + dz.width;
  }

  loadWord() {

    if(this.items.length == 0){
      AlertIOS.alert(
            'Finished vocabulary list',
            'Finished all the words you added to your list, add some new word now~'
          )
      this.closeModal4();
    }
    else {
      var rand = this.getRandomId(this.items.length);
      var word = this.items[rand].text.voc;
      this.setState({
        testId: rand,
        testWord: word
      });
    }
  }

  getRandomId(max) {
    return Math.floor(Math.random() * max);
  }

  rowStyle(rowData) {
    if(rowData.count == 2) {
      return {
        backgroundColor: '#48afdb',
        flexDirection: 'row',
        borderRadius: 5,
        paddingTop: 8,
        paddingLeft:20,
        height: 48
      }
    }

    return {
      backgroundColor: 'rgb(225,85,18)',
      flexDirection: 'row',
      borderRadius: 5,
      paddingTop: 8,
      paddingLeft:20,
      height: 48
    }
  }

  render() {

    var BContent1 = <Button onPress={this.closeModal1.bind(this)} style={[styles.btn, styles.btnModal]}>X</Button>;
    var BContent4 = <Button onPress={this.closeModal4.bind(this)} style={[styles.btn, styles.btnModal]}>X</Button>;

    return (
      <View style={styles.wrapper}>
      <View style={styles.counterView}>
        <Text style={styles.counterText}>
          {this.state.vocCount}
        </Text>
      </View>
      <View style={styles.inputcontainer}>
        <TextInput
         style={styles.input}
         returnKeyType='done'
         onChangeText={(text) => this.setState({newVoc: text})}
         value={this.state.newVoc}
         placeholder='New Word'/>
      </View>
        <Button onPress={this.openModal1.bind(this)} style={styles.btn}>Vocabulary List</Button>

        <Button onPress={this.openModal4.bind(this)} style={styles.btn}>Test</Button>

        <Modal style={[styles.modalList, styles.modal4]} position={"bottom"} ref={"modal1"} swipeArea={20} isOpen={this.state.isListOpen} onClosed={this.closeModal1.bind(this)} backdropContent={BContent1}>

          <ListView
            enableEmptySections={true}
            style = {{paddingTop:30}}
            dataSource={this.state.vocSource}
            renderRow={this.renderRow.bind(this)} />
        </Modal>

        <Modal isOpen={this.state.isTestOpen} onClosed={this.closeModal4.bind(this)} style={[styles.modal, styles.modalTest]} ref={'modal4'} position={"center"} backdropContent={BContent4}>

            <View style={styles.leftDropArea} onLayout={this.setNoZoneValues.bind(this)}>
            <Text style={styles.areaText}> No </Text>
            </View>
            <View style={styles.draggableContainer}>
              <Animated.View {...this.panResponder.panHandlers} style={[this.state.pan.getLayout(), styles.circle]}>
                    <Text style={styles.dragText}>{this.state.testWord}</Text>
              </Animated.View>
            </View>
            <View style={styles.rightDropArea} onLayout={this.setYesZoneValues.bind(this)}>
            <Text style={styles.areaText}> Yes </Text>
            </View>
        </Modal>
      </View>
    );
  }

  renderRow(rowData) {
    return (
      <TouchableHighlight
        underlayColor='#dddddd'
        onPress={() => this.removeVoc(rowData)}>
        <View style={styles.listWrapper}>
          <View style={ this.rowStyle(rowData)}>
            <Text style={styles.vocText}>{rowData.text.voc}</Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

}

AppRegistry.registerComponent('greHelper', () => greHelper);
