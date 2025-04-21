import {Button, Card, Input, Text} from '@rneui/base';
import {Controller, useForm} from 'react-hook-form';
import {useUser} from '../hooks/apiHooks';
import {Alert, StyleSheet, TouchableOpacity} from 'react-native';
import {useState} from 'react';
import {RegisterCredentials} from 'hybrid-types/DBTypes';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RegisterForm = ({
  setDisplayRegister,
}: {
  setDisplayRegister: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {postRegister, getUsernameAvailable, getEmailAvailable} = useUser();
  // toggle the visibility of the password
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const initValues: {
    username: string;
    email: string;
    password: string;
  } = {
    username: '',
    email: '',
    password: '',
  };

  const doRegister = async (inputs: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      const registerResult = await postRegister(inputs as RegisterCredentials);
      console.log('doRegister result', registerResult);
      Alert.alert('User created');
      setDisplayRegister(false);
    } catch (error) {
      console.error((error as Error).message);
      Alert.alert('User not created', (error as Error).message);
    }
  };

  const {
    control,
    getValues,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: initValues,
  });

  return (
    <>
      <Text style={styles.header}>Weedify</Text>
      <Card containerStyle={styles.card}>
        <Text style={styles.text}>Username</Text>
        <Controller
          control={control}
          rules={{
            pattern: {
              value: /^[a-zA-Z0-9._-]+$/,
              message: 'not a valid username',
            },
            minLength: {value: 3, message: 'minimum length is 3'},
            maxLength: {value: 20, message: 'maximum 20 characters'},
            required: {value: true, message: 'is required'},
            validate: async (value) => {
              try {
                const {available} = await getUsernameAvailable(value);
                console.log('username available?: ', available);
                return available ? true : 'username not available';
              } catch (error) {
                console.error((error as Error).message);
              }
            },
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              style={styles.input}
              inputContainerStyle={styles.inputContainer}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="none"
              errorMessage={errors.username?.message}
              testID="username-input"
            />
          )}
          name="username"
        />
        <Text style={styles.text}>Email</Text>

        <Controller
          control={control}
          rules={{
            pattern: {
              value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
              message: 'not a valid email',
            },
            minLength: {value: 3, message: 'minimum length is 3'},
            maxLength: 50,
            required: {value: true, message: 'is required'},
            validate: async (value) => {
              try {
                const {available} = await getEmailAvailable(value);
                console.log('email available?: ', available);
                return available ? true : 'email not available';
              } catch (error) {
                console.error((error as Error).message);
              }
            },
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              style={styles.input}
              inputContainerStyle={styles.inputContainer}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
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
            minLength: {value: 8, message: 'minimum length is 8'},
            required: {value: true, message: 'is required'},
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              style={styles.input}
              inputContainerStyle={styles.inputContainer}
              rightIcon={
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  <Ionicons
                    name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={25}
                    style={{paddingHorizontal: 10}}
                    color={HexColors['dark-grey']}
                  ></Ionicons>
                </TouchableOpacity>
              }
              secureTextEntry={isPasswordVisible}
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
          title="Register"
          onPress={handleSubmit(doRegister)}
          testID="register-button"
        />
      </Card>
      <Text style={styles.bottomText}>Or login to your account:</Text>
    </>
  );
};

export default RegisterForm;

const styles = StyleSheet.create({
  header: {
    fontWeight: 'bold',
    color: HexColors['almost-white'],
    fontSize: 28,
    fontFamily: 'KronaOne-Regular',
    textAlign: 'center',
    marginTop: 40,
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
    elevation: 5,
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: HexColors['light-green'],
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
  input: {
    padding: 8,
  },
  inputContainer: {
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    borderRadius: 10,
    backgroundColor: HexColors['almost-white'],
    borderBottomWidth: 0,
    // Android shadow
    elevation: 5,
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
