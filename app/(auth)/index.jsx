import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router"
import { useEffect, useState } from 'react';
import { auth } from "../../firebaseConf"
import { signInWithEmailAndPassword } from 'firebase/auth';
import { CustomToast, showToast } from '../components/CustomToast';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [checkingLogin, setCheckingLogin] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // router.replace("/home");
            }
            setCheckingLogin(false);
        });

        return () => unsubscribe;
    }, []);

    const validarDadosForm = () => {
        // Valida email
        if (!email || !email.includes('@')) {
            showToast('erro', 'Email inválido', 'Revise seu email!!')
            return false;
        }

        return true;
    };

    const signIn = async () => {
        return await signInWithEmailAndPassword(auth, email, password);
    };

    const tentarLogarUmUsuario = async () => {
        if (!validarDadosForm()) return;

        try {
            await signIn();
            showToast('sucesso', 'Login realizado com sucesso!!', 'Você está logado!!');
            setTimeout(() => router.replace("/home"), 3000);
        } catch (error) {
            showToast('erro', 'Erro ao logar', 'Revise suas credenciais!!');
        }
    };

    if (checkingLogin)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'lightblue' }}>
            <View style={styles.container}>
                {/* cabecalho */}
                <View style={styles.containerTitle}>
                    <Text style={styles.title}>Seja bem vindo(a),</Text>
                    <Text style={styles.title}>faça login para</Text>
                    <Text style={styles.title}>usar o app</Text>
                </View>

                {/* form */}
                <View style={styles.form}>
                    <View style={styles.field}>
                        <MaterialIcons name="email" size={24} color="#34445B" />
                        <TextInput
                            style={styles.input}
                            keyboardType='email-address'
                            placeholder='Digite seu email'
                            placeholderTextColor='#34445B'
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <View style={styles.field}>
                        <MaterialIcons name="lock" size={24} color="#34445B" />
                        <TextInput
                            style={styles.input}
                            placeholder='Digite sua senha'
                            placeholderTextColor='#34445B'
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity onPress={() => alert('Esqueci minha senha')}>
                        <Text style={[styles.link, styles.textLink]}>Esqueci minha senha!</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.buttonLogin} onPress={tentarLogarUmUsuario}>
                        <Text style={styles.buttonLoginText}>Login</Text>
                    </TouchableOpacity>
                </View>

                {/* nao tem conta? */}
                <View style={styles.containerLink}>
                    <Text style={styles.textLink}>Ainda não tem conta?</Text>
                    <TouchableOpacity onPress={() => router.push("cadastro")}>
                        <Text style={[styles.link, styles.textLink]}>Crie uma agora!</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <CustomToast />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        margin: 30
    },
    containerTitle: {
        marginTop: 30
    },
    title: {
        color: '#34445b',
        fontSize: 30
    },
    form: {
        gap: 20
    },
    field: {
        backgroundColor: '#DEE8FC',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingLeft: 10
    },
    input: {
        padding: 15,
        paddingLeft: 5,
        color: '#34445B'
    },
    buttonLogin: {
        backgroundColor: '#34445B',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonLoginText: {
        color: '#fff',
        fontSize: 20
    },
    textLink: {
        fontSize: 14
    },
    link: {
        textDecorationLine: 'underline',
        color: 'rgba(41, 128, 221, 1)'
    },
    containerLink: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 30
    },
});
