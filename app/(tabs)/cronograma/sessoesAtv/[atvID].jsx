import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import Checkbox from "../../../components/forms/Checkbox";
import { CustomToast, showToast } from "../../../components/CustomToast";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../../../firebaseConf";

export default function SessaoAtv() {
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);

    const { atividadePath, conteudoPath, atividadeJson } = useLocalSearchParams();
    const atividadeObj = JSON.parse(atividadeJson);

    // tipo da sessão
    const tipoSessao = atividadeObj.tipoSessao; // 'normal' ou 'pomodoro'
    const { tempoEstudo, tempoPausa, nome } = atividadeObj; // minutos
    console.log('atividade: ', atividadeObj.conteudo);

    // estados gerais
    const [segundos, setSegundos] = useState(0);
    const [timer, setTimer] = useState('00:00');
    const [intervalObject, setIntervalObject] = useState(null);
    const [sessaoConcluida, setSessaoConcluida] = useState(false);
    const [modoPomodoro, setModoPomodoro] = useState('estudo'); // 'estudo' ou 'pausa'
    const [numCiclos, setNumCiclos] = useState(1);
    const [conteudoConcluida, setConteudoConcluida] = useState(false);
    const [tempoInicio, setTempoInicio] = useState(null);
    const [tempoFim, setTempoFim] = useState(null);
    const [numQuestoesResolvidas, setNumQuestoesResolvidas] = useState(null);
    const [numQuestoesCorretas, setNumQuestoesCorretas] = useState(null);
    const totalCiclos = atividadeObj.numCiclos;
    const [modalInfoFoguVisible, setModalInfoFoguVisible] = useState(false);
    const [sequenciaFoguinho, setSequenciaFoguinho] = useState(0);
    const [textoBtnIniciar, setTextoBtnIniciar] = useState('Iniciar');

    // autenticacao
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (!u) router.replace("/");
            else setUser(u);
        });

        return () => unsubscribe();
    }, []);

    // formata o tempo
    useEffect(() => {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        const minStr = String(min).padStart(2, '0');
        const segStr = String(seg).padStart(2, '0');
        setTimer(`${minStr}:${segStr}`);
    }, [segundos]);

    // limpa intervalos ao sair
    useEffect(() => {
        return () => {
            if (intervalObject) clearInterval(intervalObject);
        };
    }, [intervalObject]);

    // obter timestamp atual
    const obterHoraMinutoDaDataAtual = () => {
        return Timestamp.now();
    }

    // iniciar sessão normal
    const iniciarTimerNormal = () => {
        if (intervalObject) return;

        const tempo = obterHoraMinutoDaDataAtual();
        console.log('tempoInicio:', tempo);
        setTempoInicio(tempo);

        const intervalAux = setInterval(() => {
            setSegundos(prev => prev + 1);
        }, 1000);

        setIntervalObject(intervalAux);
    };

    // parar sessão normal
    const finalizarTimerNormal = () => {
        if (intervalObject) {
            clearInterval(intervalObject);
            setIntervalObject(null);
            setSessaoConcluida(true);

            const tempo = obterHoraMinutoDaDataAtual();
            console.log('tempoFim:', tempo);
            setTempoFim(tempo);
        }
    };

    // iniciar pomodoro
    const iniciarPomodoro = () => {
        if (intervalObject) return;
        const segTempoEstudo = tempoEstudo * 60;
        const segTempoPausa = tempoPausa * 60;
        setTempoInicio(obterHoraMinutoDaDataAtual());

        // console.log('Pomodoro iniciado!');
        showToast('sucesso', 'Pomodoro iniciado!', 'Bons estudos!');
        setModoPomodoro('estudo');
        setSegundos(segTempoEstudo); // tempo de estudo
        setNumCiclos(1); // reinicia no ciclo 1

        const intervalAux = setInterval(() => {
            setSegundos(prev => {
                if (prev <= 1) {
                    setModoPomodoro(modoAtual => {
                        if (modoAtual === 'estudo') {
                            // terminou o estudo - inicia pausa
                            showToast('info', 'Tempo de estudo finalizado!', 'Pausa iniciando...');
                            setSegundos(segTempoPausa); // tempo de pausa
                            return 'pausa';
                        } else {
                            // terminou a pausa - inicia novo estudo
                            setNumCiclos(cicloAnterior => {
                                if (cicloAnterior < totalCiclos) {
                                    const proximoCiclo = cicloAnterior + 1;
                                    showToast('info', 'Pausa finalizada!', `Iniciando ciclo ${proximoCiclo}/${totalCiclos}`);
                                    setSegundos(segTempoEstudo);
                                    setModoPomodoro('estudo');
                                    return proximoCiclo;
                                } else {
                                    console.log(`Todos os ${totalCiclos} ciclos finalizados!`);
                                    showToast('sucesso', 'Pomodoro completo!', 'Parabéns');
                                    clearInterval(intervalAux);
                                    setIntervalObject(null);
                                    setModoPomodoro('finalizado');
                                    setSessaoConcluida(true);
                                    setTimer('00:00');
                                    return cicloAnterior;
                                }
                            });
                            return modoAtual; // mantém o modo até atualização
                        }
                    });
                    return prev; // evita decrementar no zero
                }
                return prev - 1;
            });
        }, 1000);

        setIntervalObject(intervalAux);
    };

    // finalizar pomodoro
    const finalizarPomodoro = () => {
        if (intervalObject) {
            clearInterval(intervalObject);
            setIntervalObject(null);
        }
        setModoPomodoro('estudo');
        setSegundos(0);
        setTempoFim(obterHoraMinutoDaDataAtual());
    };

    // resetar timer normal
    const resetTimer = () => {
        if (intervalObject) return;
        setSegundos(0);
        setSessaoConcluida(false);
        setTimer('00:00');
    };

    // marcar conteudo como concluido
    const setStatusCheckbox = (lbl, sts) => {
        setConteudoConcluida(sts);
        console.log('Status: ', sts);
    };

    // buscar sequencia foguinho
    useEffect(() => {
        if (!user) return;

        const fetchStreak = async () => {
            try {
                const qStreak = query(
                    collection(db, "streak"),
                    where("user", "==", user.email),
                );
                const streakSnap = await getDocs(qStreak);

                if (!streakSnap.empty) {
                    const streakData = streakSnap.docs[0].data();
                    setSequenciaFoguinho(streakData.numSequencia || 0);
                    console.log("Sequência do foguinho:", streakData.numSequencia || 0);
                    console.log("Data última sessão:", streakData.dataUltimaSessao?.toDate());
                    console.log("Data hoje:", new Date());
                    // verificar se perdeu o foguinho
                    const ultimaSessao = streakData.dataUltimaSessao?.toDate();
                    if (ultimaSessao) {
                        const hoje = new Date();
                        const diffTime = hoje - ultimaSessao;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays >= 2) {
                            // perdeu o foguinho
                            setModalPerdeuFoguinVisible(true);
                            console.log("Usuário perdeu o foguinho!");
                        } else {
                            console.log("Usuário manteve o foguinho.");
                        }
                    }
                }
            } catch (err) {
                console.log("Erro ao buscar a sequência do foguinho");
                console.error(err);
            }
        };
        fetchStreak();
    }, [user]);

    // normalizar datas (zerar horas, min, seg, ms)
    function normalizeDate(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // salvar foguinho
    const salvarFoguinho = async () => {
        try {
            const qStreak = query(
                collection(db, "streak"),
                where("user", "==", user.email),
            );
            const streakSnap = await getDocs(qStreak);

            if (!streakSnap.empty) {
                const streakDoc = streakSnap.docs[0];
                const ultimaSessao = streakDoc.data().dataUltimaSessao?.toDate();

                const hoje = new Date();
                let novaSequenciaFinal = 1;

                if (ultimaSessao) {
                    const diffTime = normalizeDate(hoje) - normalizeDate(ultimaSessao);
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        // manteve o streak
                        novaSequenciaFinal = (streakDoc.data().numSequencia || 0) + 1;
                    } else if (diffDays >= 2) {
                        // perdeu o streak -> volta para 1
                        novaSequenciaFinal = 1;
                    } else {
                        // estudou no mesmo dia
                        novaSequenciaFinal = streakDoc.data().numSequencia || 1;
                    }
                }

                const timestampAgora = Timestamp.now();
                await updateDoc(streakDoc.ref, {
                    numSequencia: novaSequenciaFinal,
                    dataUltimaSessao: timestampAgora,
                });

                setSequenciaFoguinho(novaSequenciaFinal);
                console.log("Sequência do foguinho atualizada para:", novaSequenciaFinal);

                await agendarNotificacoesExpiracaoFoguinho(timestampAgora);
            }
        } catch (err) {
            console.log("Erro ao salvar a sequência do foguinho");
            console.error(err);
        }
    };

    // salvar conteudo
    const atualizarStatusConteudo = async () => {
        try {
            const conteudoRef = doc(db, conteudoPath);

            // buscar o documento atual
            const conteudoSnap = await getDoc(conteudoRef);

            if (!conteudoSnap.exists()) {
                console.log("Conteúdo não encontrado.");
                return;
            }

            const statusAtual = conteudoSnap.data().status;

            // decidir o novo status
            const novoStatus = conteudoConcluida
                ? "concluido"
                : statusAtual;  // mantém o que estava antes

            // atualizar
            await updateDoc(conteudoRef, {
                status: novoStatus
            });

            console.log("Status atualizado para:", novoStatus);

        } catch (err) {
            console.error("Erro ao atualizar conteúdo:", err);
        }
    };

    // salvar sessao
    const salvarSessao = async () => {

        const atividadeRef = doc(db, atividadePath);
        const conteudoRef = doc(db, conteudoPath);

        console.log("atividadePath:", atividadePath);
        console.log("conteudoPath:", conteudoPath);

        try {
            const obj = {
                user: user.email,
                tempoInicio,
                atividade: atividadeRef,
                conteudo: conteudoRef || null,
                numQuestoesResolvidas: numQuestoesResolvidas || 0,
                numQuestoesCorretas: numQuestoesCorretas || 0,
            };

            let nomeColecao;
            if (tipoSessao == "normal") {
                nomeColecao = "sessaoEstudo";
                obj.tempoFim = tempoFim;
            } else {
                nomeColecao = "sessaoEstudoPomodoro";
                obj.numCiclos = atividadeObj.numCiclos;
                obj.tempoEstudo = atividadeObj.tempoEstudo;
                obj.tempoPausa = atividadeObj.tempoPausa;
            }

            console.log("✅ Objeto pronto pra salvar:", obj);

            const docRef = await addDoc(collection(db, nomeColecao), obj);

            console.log("✅ Sessão salva com sucesso!");
            console.log("🆔 ID do documento:", docRef.id);

            showToast('sucesso', 'Sessão de estudos encerrada!', 'Ótimo trabalho');

            setTimeout(() => {
                setModalInfoFoguVisible(true);
                salvarFoguinho();
            }, 3000);
        } catch (err) {
            console.error("❌ Erro ao salvar sessão:", err);
            showToast("erro", "Erro ao salvar sessão", err.message);
        }
    };

    // IDs exclusivos para notificações do foguinho
    const FOQUINHO_IDS = [
        "foguinho_teste",
        "foguinho_8h",
        "foguinho_4h",
        "foguinho_1h",
        "foguinho_expirado",
    ];

    // cancelar SOMENTE notificações do foguinho
    const cancelarNotificacoesFoguinho = async () => {
        for (const id of FOQUINHO_IDS) {
            try {
                await Notifications.cancelScheduledNotificationAsync(id);
                console.log("Cancelada:", id);
            } catch (e) {
                // Se não existir, ignore
            }
        }
    };

    // agendar notificacoes expiracao foguinho
    const agendarNotificacoesExpiracaoFoguinho = async (timestampAgora) => {

        // Cancelar apenas as do foguinho
        await cancelarNotificacoesFoguinho();

        const agora = new Date(timestampAgora.toDate());

        // expira em 48h depois da última sessão
        const dataExpiracao = new Date(agora.getTime() + 48 * 60 * 60 * 1000);

        // horários antes de expirar
        const datas = [
            { minutos: 2, id: "foguinho_teste", title: "⏱ Teste!", body: "Chegou após 2 minutos!" },
            { horas: 8, id: "foguinho_8h", title: "Seu foguinho expira em 8h!", body: "Estude pra manter o streak!" },
            { horas: 4, id: "foguinho_4h", title: "Seu foguinho expira em 4h!", body: "Ainda dá tempo!" },
            { horas: 1, id: "foguinho_1h", title: "Seu foguinho expira em 1h!", body: "Última chance!" },
            { horas: 0, id: "foguinho_expirado", title: "Seu foguinho expirou 😢", body: "Vamos recomeçar?" },
        ];

        for (const item of datas) {
            const dataAlvo = new Date(dataExpiracao.getTime() - item.horas * 60 * 60 * 1000);
            const segundosAteAlvo = Math.max(0, Math.floor((dataAlvo - new Date()) / 1000));

            await Notifications.scheduleNotificationAsync({
                identifier: item.id, // identificação única para cancelamento
                content: {
                    title: item.title,
                    body: item.body,
                },
                trigger: { seconds: segundosAteAlvo },
            });

            console.log(`📌 Notificação agendada: ${item.title} — para: ${dataAlvo}`);
        }
    };

    // salvar sessao e conteudo
    const handleSalvarSessaoEConteudo = async () => {
        await atualizarStatusConteudo();
        await salvarSessao();
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView>
                <View style={styles.container}>
                    <TouchableOpacity
                        style={{ position: 'absolute', left: 0, top: 3, zIndex: 1 }}
                        onPress={() => router.replace('cronograma')}
                    >
                        <MaterialIcons
                            name="chevron-left"
                            size={40}
                            color='#34445B'
                        />
                    </TouchableOpacity>
                    <Text style={styles.title}>Iniciar Sessão</Text>
                    <Text style={{ textAlign: 'center', color: '#34445B' }}>
                        {tipoSessao === 'pomodoro' ? `Modo Pomodoro (${modoPomodoro})` : 'Modo Normal'}
                    </Text>
                    <Text
                        style={{
                            color: '#34445B',
                            fontWeight: 'bold',
                            fontSize: 20,
                            textAlign: 'center'
                        }}
                    >
                        {nome}
                    </Text>
                    {tipoSessao === 'pomodoro' && (
                        <Text style={{ textAlign: 'center', color: '#34445B', fontWeight: 'bold' }}>
                            Ciclo {numCiclos}/{totalCiclos}
                        </Text>
                    )}
                </View>

                <View style={{ margin: 20, marginTop: 0 }}>
                    <View style={styles.containerSessao}>
                        <Text style={styles.displayTimer}>{timer}</Text>

                        <View style={styles.containerButtons}>
                            {tipoSessao === 'pomodoro' ? (
                                <>
                                    {/* botao iniciar */}
                                    <TouchableOpacity
                                        style={[styles.containerBtnIconText, intervalObject ? styles.btnDisabled : null]}
                                        onPress={iniciarPomodoro}
                                        disabled={intervalObject}
                                    >
                                        <MaterialIcons name="play-arrow" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>Iniciar</Text>
                                    </TouchableOpacity>

                                    {/* botao finalizar */}
                                    <TouchableOpacity
                                        style={[
                                            styles.containerBtnIconText,
                                            !intervalObject ? styles.btnDisabled : null
                                        ]}
                                        disabled={!intervalObject}
                                        onPress={finalizarPomodoro}
                                    >
                                        <MaterialIcons name="stop" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>Finalizar</Text>
                                    </TouchableOpacity>

                                    {/* botao reset */}
                                    <TouchableOpacity
                                        style={[
                                            styles.containerBtnIconText,
                                            intervalObject ? styles.btnDisabled : null
                                        ]}
                                        disabled={intervalObject}
                                        onPress={resetTimer}
                                    >
                                        <MaterialIcons name="refresh" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>Resetar</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* botao iniciar */}
                                    <TouchableOpacity
                                        style={[styles.containerBtnIconText, intervalObject ? styles.btnDisabled : null]}
                                        onPress={iniciarTimerNormal}
                                        disabled={intervalObject}
                                    >
                                        <MaterialIcons name="play-arrow" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>{textoBtnIniciar}</Text>
                                    </TouchableOpacity>

                                    {/* botao finalizar */}
                                    <TouchableOpacity
                                        style={[
                                            styles.containerBtnIconText,
                                            !intervalObject ? styles.btnDisabled : null
                                        ]}
                                        disabled={!intervalObject}
                                        onPress={finalizarTimerNormal}
                                    >
                                        <MaterialIcons name="stop" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>Finalizar</Text>
                                    </TouchableOpacity>

                                    {/* botao reset */}
                                    <TouchableOpacity
                                        style={[
                                            styles.containerBtnIconText,
                                            intervalObject ? styles.btnDisabled : null
                                        ]}
                                        disabled={intervalObject}
                                        onPress={resetTimer}
                                    >
                                        <MaterialIcons name="refresh" size={24} color='#fff' />
                                        <Text style={{ color: '#fff' }}>Resetar</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <View style={styles.containerInputs}>
                            <TextInput
                                style={styles.input}
                                placeholder="Questões realizadas"
                                value={numQuestoesResolvidas}
                                onChangeText={setNumQuestoesResolvidas}
                                placeholderTextColor='#555'
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Questões corretas"
                                value={numQuestoesCorretas}
                                onChangeText={setNumQuestoesCorretas}
                                placeholderTextColor='#555'
                            />
                        </View>

                        <Checkbox
                            label='Marcar conteúdo como concluído'
                            onPress={setStatusCheckbox}
                        />

                        <TouchableOpacity
                            style={[
                                styles.containerBtnSave,
                                !sessaoConcluida ? styles.btnDisabled : null
                            ]}
                            disabled={!sessaoConcluida}
                            onPress={handleSalvarSessaoEConteudo}
                        >
                            <Text style={{ color: '#fff' }}>Armazenar sessão</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* toast */}
            <CustomToast />

            {/* modal foguin sequencia */}
            <Modal
                visible={modalInfoFoguVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalInfoFoguVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalInfoFoguVisible(false)}>

                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View
                                    style={{
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 20,
                                        padding: 20,
                                    }}
                                >
                                    <View style={{ alignItems: "center" }}>
                                        <Image
                                            source={require("../../../../assets/foguu.gif")}
                                            style={{ width: 150, height: 150 }}
                                        />
                                        <Text style={{ fontSize: 48 }}>
                                            {sequenciaFoguinho}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 18,
                                                textAlign: "center",
                                            }}
                                        >
                                            Parabéns! Você alcançou um streak de {sequenciaFoguinho} dia(s) estudando! Continue assim!!
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
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
        fontWeight: 'bold'
    },
    containerSessao: {
        // borderWidth: 1,
        // borderColor: '#34445B',
        padding: 10,
        gap: 10
    },
    containerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10
    },
    containerBtnIconText: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#34445B',
        backgroundColor: '#34445B',
        flex: 1
    },
    containerBtnSave: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#34445B',
        backgroundColor: '#34445B',
        flex: 1
    },
    btnDisabled: {
        opacity: 0.7
    },
    displayTimer: {
        borderRadius: 10,
        padding: 5,
        textAlign: 'center',
        fontSize: 60,
        color: '#34445B'
    },
    containerInputs: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15
    },
    input: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 5,
        height: 40,
        paddingStart: 3,
        flex: 1,
        // width: '100%'
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        // backgroundColor: 'lightblue',
        backgroundColor: "#FFA500",
        borderWidth: 2,
        borderColor: '#34445B',
        borderRadius: 10,
        width: '95%',
        padding: 20,
        maxHeight: '85%'
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
    }
});
