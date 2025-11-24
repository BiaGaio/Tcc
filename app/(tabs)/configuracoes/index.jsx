import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useRouter } from "expo-router";
import { getAuth, updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import InputField from '../../components/forms/InputField';

export default function Configuracoes() {
    const router = useRouter();
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [modalChangePasswordVisible, setModalChangePasswordVisible] = useState(false);
    const [modalInfoAppVisible, setModalInfoAppVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (!u) {
                router.replace("/");
            } else {
                setUser(u);
            }
        });

        return () => unsubscribe();
    }, []);

    const salvarNovaSenha = async () => {
        if (!novaSenha || !confirmarSenha) {
            alert("Preencha todos os campos.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Usuário não autenticado.");
                return;
            }

            await updatePassword(user, novaSenha);
            alert("Senha atualizada com sucesso! 🔒");
            setModalChangePasswordVisible(false);
            setNovaSenha('');
            setConfirmarSenha('');
        } catch (error) {
            console.error("Erro ao atualizar senha:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Por segurança, faça login novamente antes de mudar a senha.");
            } else {
                alert("Erro ao atualizar senha.");
            }
        }
    };

    const logoutApp = () => {
        auth.signOut();
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'lightblue' }}>
            <View style={styles.container}>
                <Text style={styles.title}>Configurações</Text>

                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontSize: 20 }}>Usuário: {user?.email ?? "Nenhum"}</Text>
                </View>

                {/* modal info app */}
                <Modal
                    visible={modalInfoAppVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalInfoAppVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setModalInfoAppVisible(false)}>
                        <View style={styles.modalBackdrop}>
                            {/* Evita fechar ao clicar dentro do conteúdo */}
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    {/* Título */}
                                    <Text style={styles.modalTitle}>Sobre o app</Text>

                                    {/* Conteúdo */}
                                    <Text style={{ marginTop: 20, textAlign: "justify" }}>
                                        O aplicativo <Text style={{ fontWeight: "bold" }}>SOS</Text> foi criado para ajudar estudantes a organizarem seus estudos de forma simples e eficiente.
                                        Você pode cadastrar áreas, matérias e conteúdos, monitorar seu progresso e manter tudo sincronizado com sua conta.
                                        {"\n\n"}
                                        <Text style={{ fontWeight: "bold" }}>Versão:</Text> 1.0.0{"\n"}
                                        <Text style={{ fontWeight: "bold" }}>Desenvolvido por:</Text> Beatriz Gaio{"\n"}
                                        <Text style={{ fontWeight: "bold" }}>Contato:</Text> suporte@beatriz.com
                                    </Text>


                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* atualizar senha */}
                <Modal
                    visible={modalChangePasswordVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalChangePasswordVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalContent}>

                            <ScrollView>
                                {/* Botão de fechar */}
                                <TouchableOpacity
                                    style={styles.btnClose}
                                    onPress={() => setModalChangePasswordVisible(false)}
                                >
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                {/* Título */}
                                <Text style={styles.modalTitle}>Atualizar senha</Text>

                                <View style={{ marginTop: 20, gap: 10 }}>
                                    <InputField
                                        label='Nova senha'
                                        placeholder='Digite sua nova senha'
                                        secureTextEntry
                                        value={novaSenha}
                                        onChangeText={setNovaSenha}
                                    />

                                    <InputField
                                        label='Confirme sua senha'
                                        placeholder='Confirme sua senha'
                                        secureTextEntry
                                        value={confirmarSenha}
                                        onChangeText={setConfirmarSenha}
                                    />
                                </View>

                                <View style={{ marginTop: 20 }}>
                                    <TouchableOpacity style={styles.button} onPress={salvarNovaSenha}>
                                        <Text style={{ color: "#fff" }}>Salvar</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* estilizar a lista de opcoes */}
                <View style={styles.listItemMenu}>
                    <TouchableOpacity style={styles.itemMenu} onPress={() => setModalChangePasswordVisible(true)}>
                        <MaterialIcons name='password' size={20} color='#34445B' />
                        <Text style={{ fontSize: 16 }}>Atualizar senha</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemMenu} onPress={() => setModalInfoAppVisible(true)}>
                        <MaterialIcons name='info' size={20} color='#34445B' />
                        <Text style={{ fontSize: 16 }}>Sobre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemMenu} onPress={logoutApp}>
                        <MaterialIcons name='logout' size={20} color='#34445B' />
                        <Text style={{ fontSize: 16 }}>Sair</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemMenu} onPress={() => alert('Excluindo...')}>
                        <MaterialIcons name='delete' size={20} color='#34445B' />
                        <Text style={{ fontSize: 16 }}>Excluir conta</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </SafeAreaView >
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 25,
        marginBottom: 15,
        gap: 10,
    },
    title: {
        color: "#34445B",
        fontSize: 30,
        textAlign: "center",
    },
    listItemMenu: {
        gap: 7
    },
    itemMenu: {
        flexDirection: 'row',
        gap: 5,
        borderWidth: 1,
        borderColor: '#34445B',
        padding: 10,
        alignItems: 'center',
        borderRadius: 12,
        boxShadow: '0 1px 1px #000'
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'lightblue',
        borderWidth: 2,
        borderColor: '#34445B',
        borderRadius: 10,
        width: '95%',
        padding: 20,
    },
    btnClose: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    modalTitle: {
        color: "#34445B",
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#34445B",
        padding: 10,
        borderRadius: 10,
        width: "100%",
        alignItems: "center"
    }
});

