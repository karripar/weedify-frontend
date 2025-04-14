import {RecipeWithOwner} from 'hybrid-types/DBTypes';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {Button, Card, ListItem} from '@rneui/base';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RecipeListItemProps = {
  item: RecipeWithOwner;
  navigation: NavigationProp<ParamListBase>;
};

const RecipeListItem = ({item, navigation}: RecipeListItemProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('Single', {item});
      }}
    >
      <Card containerStyle={styles.card}>
        <ListItem>
          <Text>{item.username}</Text>
        </ListItem>
        <ListItem>
          <Text>
            Posted on {new Date(item.created_at).toLocaleDateString('fi-FI')}
          </Text>
        </ListItem>
        <Image
          style={styles.image}
          source={{
            uri:
              item.thumbnail ||
              (item.screenshots && item.screenshots[2]) ||
              undefined,
          }}
        />
        <ListItem>
          <Text>{item.title}</Text>
        </ListItem>
        <ListItem>
          <Text>({item.cooking_time} min)</Text>
        </ListItem>
        <ListItem>
          <Text>{item.difficulty_level_id}</Text>
        </ListItem>
        <View style={[styles.flexView, {marginHorizontal: 20}]}>
          <Ionicons
            style={{marginHorizontal: 10}}
            name={'heart-outline'}
            size={34}
          ></Ionicons>
          <Ionicons name={'chatbubble-outline'} size={30}></Ionicons>
        </View>
        <View style={styles.flexView}>
          <Button
            buttonStyle={[
              styles.button,
              {flex: 2, borderWidth: 1, borderColor: HexColors['light-grey']},
            ]}
            containerStyle={styles.buttonContainer}
            titleStyle={[styles.buttonTitle, {color: HexColors['dark-green']}]}
          >
            Add as favorite
          </Button>
          <Button
            buttonStyle={[
              styles.button,
              {flex: 1, backgroundColor: HexColors['dark-green']},
            ]}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
          >
            Open
          </Button>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 230,
  },
  card: {
    paddingHorizontal: 0,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 0,
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
    color: HexColors['light-purple'],
  },
  button: {
    backgroundColor: HexColors.white,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
    marginHorizontal: 5,
    padding: 10,
    paddingHorizontal: 20,
    // Android shadow
    elevation: 4,
  },
  buttonContainer: {
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  flexView: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 10,
  },
});

export default RecipeListItem;
