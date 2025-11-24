import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router"
import { auth, db } from "../../../firebaseConf"
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { CustomToast, showToast } from '../../components/CustomToast';

export default function Cadastro() {
  const router = useRouter();

  // const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Função de validação retorna true/false
  const validarDadosForm = () => {
    // Valida email
    if (!email || !email.includes('@')) {
      alert("Email inválido");
      return false;
    }

    // Valida senha
    if (!password || password.length < 6) {
      alert("Senha deve ter pelo menos 6 caracteres");
      return false;
    }

    // Confirmação de senha
    if (password !== confirmPassword) {
      alert("Senhas não conferem");
      return false;
    }

    return true; // tudo certo
  };

  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      alert("Erro ao criar conta: " + error.message);
    }
  };

  const signIn = async () => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const tentarCriarUmUsuario = async () => {
    if (!validarDadosForm()) return;

    try {
      // cria conta
      await signUp();

      // criar conteúdos padrões após criar a conta
      await criarConteudoPadrao();

      // fazer o login automático
      await signIn();
      showToast('sucesso', 'Login realizado com sucesso!!', 'Você está logado!!');
      setTimeout(() => router.replace("/home"), 3000);
    } catch (error) {
      console.error("Erro geral:", error);
    }
  };

  // criar conteudos padroes da conta
  const criarConteudoPadrao = async () => {
    try {
      const mapAreasMaterias = {
        // "Ciências da Natureza e suas Tecnologias": [
        //   "Biologia",
        //   "Física",
        //   "Química"
        // ],
        // "Ciências Humanas e suas Tecnologias": [
        //   "História",
        //   "Geografia",
        //   "Filosofia",
        //   "Sociologia"
        // ],
        // "Linguagens, Códigos e suas Tecnologias": [
        //   "Português",
        //   "Inglês",
        //   "Artes",
        //   "Educação Física"
        // ],
        "XXX - Matemática e suas Tecnologias": [
          "XXX - Matemática"
        ]
      };

      for (const [areaNome, materias] of Object.entries(mapAreasMaterias)) {

        // criar área
        const areaRef = await addDoc(collection(db, "areas"), {
          nome: areaNome,
          user: email
        });

        // criar as matérias da área
        for (const materiaNome of materias) {
          await addDoc(collection(db, "materias"), {
            nome: materiaNome,
            area: areaRef,   // referência da área criada
            user: email
          });
        }
      }

      console.log("Conteúdos padrão criados com sucesso!");
      showToast("sucesso", "Conteúdo criado", "As áreas e matérias padrão foram geradas!");

    } catch (error) {
      console.error("Erro ao criar conteúdo padrão:", error);
      showToast("erro", "Erro", "Não foi possível criar o conteúdo padrão.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'lightblue' }}>
      <View style={styles.container}>
        {/* cabecalho */}
        <View style={styles.containerTitle}>
          <Text style={styles.title}>Seja bem vindo(a),</Text>
          <Text style={styles.title}>crie uma conta para</Text>
          <Text style={styles.title}>usar o app</Text>
        </View>

        {/* form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <MaterialIcons name="email" size={24} color="#34445B" />
            <TextInput
              style={styles.input}
              placeholder='Digite seu email'
              placeholderTextColor='#34445B'
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
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
          <View style={styles.field}>
            <MaterialIcons name="lock" size={24} color="#34445B" />
            <TextInput
              style={styles.input}
              placeholder='Cofirme sua senha'
              placeholderTextColor='#34445B'
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={styles.buttonLogin} onPress={tentarCriarUmUsuario}>
            <Text style={styles.buttonLoginText}>Criar</Text>
          </TouchableOpacity>
        </View>

        {/* nao tem conta? */}
        <View style={styles.containerLink}>
          <Text style={styles.textLink}>Já possui uma conta?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.link, styles.textLink]}>Entrar!</Text>
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
  buttonLogin: {
    backgroundColor: '#34445b',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center'
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
    color: '#34445B',
    flex: 1
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
