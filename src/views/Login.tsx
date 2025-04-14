import {useEffect, useState} from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import {Button} from '@rneui/base';
import {useUserContext} from '../hooks/contextHooks';
import {StyleSheet} from 'react-native';
import {HexColors} from '../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

const Login = () => {
  const [displayRegister, setDisplayRegister] = useState(false);
  const {handleAutoLogin} = useUserContext();

  const toggleRegister = () => {
    setDisplayRegister(!displayRegister);
  };

  useEffect(() => {
    handleAutoLogin();
  }, []);

  return (
    <>
    <LinearGradient
      colors={[
        HexColors['medium-green'],
        HexColors.green,
        HexColors['darker-green'],
        HexColors['darkest-green'],
      ]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      locations={[0, 0.4, 0.8, 1]}
      >
      {displayRegister ? (
        <RegisterForm setDisplayRegister={setDisplayRegister} />
      ) : (
        <LoginForm />
      )}
      <Button
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
        titleStyle={styles.buttonTitle}
        onPress={toggleRegister}
        testID="toggle-login"
      >
        {displayRegister ? 'Login' : 'Register'}
      </Button>
      </LinearGradient>
    </>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: HexColors['medium-green'],
    width: 250,
    margin: 'auto',
    marginTop: 15,
    marginBottom: 10,
    padding: 8,
  },
  buttonContainer: {
    borderRadius: 20,
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    // Android shadow
    elevation: 5,
  },
});
