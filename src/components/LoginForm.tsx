import {Controller, useForm} from 'react-hook-form';
import {useUserContext} from '../hooks/contextHooks';
import {Button, Card, Text} from '@rneui/base';
import {Input} from '@rneui/themed';

import {HexColors} from '../utils/colors';
import {StyleSheet} from 'react-native';
import { Credentials } from 'hybrid-types/DBTypes';

const LoginForm = () => {
  const {handleLogin} = useUserContext();
  const initValues: Credentials = {email: '', password: ''};
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: initValues,
  });

  const doLogin = async (inputs: Credentials) => {
    handleLogin(inputs);
  };

  return (
    <>
      <Text style={styles.header}>Weedify</Text>
      <Card containerStyle={styles.card}>
        <Text style={styles.text}>Email</Text>
        <Controller
          control={control}
          rules={{
            minLength: 3,
            maxLength: 50,
            required: {value: true, message: 'is required'},
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              style={styles.input}
              inputContainerStyle={styles.inputContainer}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
              errorMessage={errors.email?.message}
              testID="email-input"
            />
          )}
          name="email"
        />

        <Text style={styles.text}>Password</Text>
        <Controller
          control={control}
          rules={{
            minLength: 10,
            maxLength: 50,
            required: {value: true, message: 'is required'},
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              style={styles.input}
              inputContainerStyle={styles.inputContainer}
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              errorMessage={errors.password?.message}
              testID="password-input"
            />
          )}
          name="password"
        />
        <Button
          buttonStyle={styles.button}
          containerStyle={styles.buttonContainer}
          titleStyle={styles.buttonTitle}
          title="Login"
          onPress={handleSubmit(doLogin)}
          testID="login-button"
        />
      </Card>
      <Text style={styles.bottomText}>Or create an account:</Text>
    </>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  header: {
    fontWeight: 'bold',
    fontFamily: 'KronaOne-Regular',
    color: HexColors['almost-white'],
    fontSize: 28,
    textAlign: 'center',
  },
  card: {
    backgroundColor: HexColors['green'],
    borderRadius: 20,
    borderWidth: 0,
    margin: 40,
    marginTop: 30,
    padding: 20,
    // iOS shadow
    shadowColor: HexColors['light-green'],
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    // Android shadow
    elevation: 10,
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: HexColors['light-green'],
    margin: 'auto',
    marginTop: 15,
    marginBottom: 10,
    padding: 8,
    width: 250,
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
  input: {
    backgroundColor: HexColors['almost-white'],
    padding: 8,
    borderRadius: 10,
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    // Android shadow
    elevation: 5,
  },
  inputContainer: {
    borderBottomWidth: 0,
  },
  text: {
    color: HexColors['almost-white'],
    margin: 10,
    fontWeight: 'bold',
  },
  bottomText: {
    textAlign: 'center',
    color: HexColors['almost-white'],
    marginTop: 40,
    marginBottom: 10,
  },
});
