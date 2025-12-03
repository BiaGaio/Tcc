import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, View, TouchableOpacity, Image, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebaseConf';
import LabelDia from "../../components/home/LabelDia";

export default function Home() {
    const router = useRouter();
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);
    const [listAreas, setListAreas] = useState([]);
    const [listConteudos, setListConteudos] = useState([]);
    const [mapConteudosAreas, setMaptConteudosAreas] = useState([]);
    const [listAtividades, setListAtividades] = useState([]);
    const [modalInfoFoguVisible, setModalInfoFoguVisible] = useState(false);
    const [modalPerdeuFoguinVisible, setModalPerdeuFoguinVisible] = useState(false);
    const [modalManterFoguinVisible, setModalManterFoguinVisible] = useState(false);
    const [sequenciaFoguinho, setSequenciaFoguinho] = useState(0);
    const [foguinAceso, setFoguinAceso] = useState(true);

    // autenticacao
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (!u) {
                router.replace("/"); // redireciona se não estiver logado
            } else {
                setUser(u);
            }
        });

        return () => unsubscribe();
    }, []);

    
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user) {
                    console.log("Iniciando busca de áreas e matérias para o usuário:", user.email);
    
                    // 1. Buscar áreas e matérias do Firestore
                    const areasQuery = query(collection(db, "areas"), where("user", "==", user.email));
                    const materiasQuery = query(collection(db, "materias"), where("user", "==", user.email));
    
                    console.log("Consultando áreas no Firestore...");
                    const areasSnapshot = await getDocs(areasQuery);
                    console.log("Áreas encontradas:", areasSnapshot.docs.length);
    
                    console.log("Consultando matérias no Firestore...");
                    const materiasSnapshot = await getDocs(materiasQuery);
                    console.log("Matérias encontradas:", materiasSnapshot.docs.length);
    
                    const areas = areasSnapshot.docs.map(doc => (
                        {
                            ref: doc.ref,
                            ...doc.data()
                        }
                    ));
                    const materias = materiasSnapshot.docs.map(doc => doc.data());
    
                    console.log("Áreas:", areas);
                    console.log("Matérias:", materias);
    
                    // 2. Excluir áreas e matérias duplicadas
    
                    // Filtra as áreas para manter apenas uma por nome
                    const uniqueAreas = [];
                    const areaNamesSet = new Set();
    
                    console.log("Filtrando áreas para remover duplicatas...");
                    for (const area of areas) {
                        if (!areaNamesSet.has(area.nome)) {
                            uniqueAreas.push(area);
                            areaNamesSet.add(area.nome);
                        } else {
                            console.log(`Área duplicada encontrada: ${area.ref}. Excluindo...`);
                            await deleteDoc(area.ref);
                        }
                    }
    
                    console.log("Áreas únicas após filtro:", uniqueAreas);
    
                    // Filtra as matérias para manter apenas uma por nome e área
                    const uniqueMaterias = [];
                    const materiaSet = new Set();
    
                    console.log("Filtrando matérias para remover duplicatas...");
                    for (const materia of materias) {
                        const key = `${materia.nome}-${materia.area.id}`;  // Combina nome da matéria e área para garantir unicidade
    
                        if (!materiaSet.has(key)) {
                            uniqueMaterias.push(materia);
                            materiaSet.add(key);
                        } else {
                            console.log(`Matéria duplicada encontrada: ${materia.nome} na área ${materia.area.nome}. Excluindo...`);
                            await deleteDoc(materia.ref);
                        }
                    }
    
                    console.log("Matérias únicas após filtro:", uniqueMaterias);
    
                    // Agora, você pode atualizar seu estado, se necessário:
                    // setUniqueAreas(uniqueAreas);
                    // setUniqueMaterias(uniqueMaterias);
                }
            } catch (error) {
                console.error("Erro ao buscar ou excluir duplicatas: ", error);
            }
        };
    
        fetchData();
    }, [user]);
    


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

                        // zera hora/min/seg para comparar corretamente só os dias
                        const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                        const ultimaZerada = new Date(
                            ultimaSessao.getFullYear(),
                            ultimaSessao.getMonth(),
                            ultimaSessao.getDate()
                        );

                        const diffTime = hojeZerado - ultimaZerada;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        console.log("diferença em dias:", diffDays);

                        if (diffDays >= 2) {
                            // perdeu o foguinho
                            setModalPerdeuFoguinVisible(true);
                            console.log("🔥 Foguinho PERDIDO!");
                            setFoguinAceso(false);

                        } else if (diffDays === 1) {
                            // não estudou hoje
                            setModalManterFoguinVisible(true);
                            console.log("⚠️ Usuário NÃO estudou hoje.");
                            setFoguinAceso(false);

                        } else {
                            // diffDays === 0 -> estudou hoje
                            console.log("✅ Usuário estudou hoje.");
                            setFoguinAceso(true);
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

    // zerar foguin usuario apos alerta que perdeu
    const resetStreak = async () => {
        if (!user) return;
        try {
            const qStreak = query(
                collection(db, "streak"),
                where("user", "==", user.email),
            );
            const streakSnap = await getDocs(qStreak);
            if (!streakSnap.empty) {
                const streakDoc = streakSnap.docs[0];
                await updateDoc(streakDoc.ref, {
                    numSequencia: 0,
                });
                setSequenciaFoguinho(0); // 280 pq carrega com 0, aí n sei se deu certo ou nao ;-;
                console.log("Sequência do foguinho zerada.");
            }
        } catch (err) {
            console.log("Erro ao zerar a sequência do foguinho");
            console.error(err);
        }
    };

    // fechar modal perdeu foguin e resetar streak
    const handleCloseModalPerdeuFoguin = () => {
        setModalPerdeuFoguinVisible(false);
        resetStreak();
    };

    // buscar areas
    useEffect(() => {
        if (!user) return;

        const fecthAreas = async () => {
            try {
                const qArea = query(
                    collection(db, "areas"),
                    where("user", "==", user?.email),
                );

                const areaSnap = await getDocs(qArea);

                const listaFB = !areaSnap.empty ? areaSnap.docs : null;
                console.log("user: ", user?.email);
                console.log('areas: ', listaFB); // != null ? listaFB.map(x => x.data()) : 'Nenhuma área encontrada');
                setListAreas(listaFB);

            } catch (err) {
                console.log("Erro ao buscar as áreas");
                console.error(err);
            }
        };
        fecthAreas();
    }, [user]);

    // buscar os conteudos das areas
    useEffect(() => {
        const fecthConteudos = async () => {
            try {
                const qConteudos = query(
                    collection(db, "conteudos")
                );

                const conteudosSnap = await getDocs(qConteudos);

                const listaFB = !conteudosSnap.empty ? conteudosSnap.docs : [];
                setListConteudos(listaFB);
                console.log('conteudos: ', listaFB);//.map(x => x.data()));

            } catch (err) {
                console.log("Erro ao buscar os conteúdos das áreas");
                console.error(err);
            }
        };
        fecthConteudos();
    }, [user]);

    // organizar os conteudos por area, informando a porcentagem e número de conteudos iniciados
    useEffect(() => {
        if (!listAreas || !listConteudos) return;
        // if (!Array.isArray(listAreas) || !Array.isArray(listConteudos)) return;

        console.log('OrganZ-A: ', listAreas.map(doc => doc.data().nome));
        console.log('OrganZ-C: ', listConteudos.map(doc => doc.data().nome));

        const organizados = listAreas.map(areaDoc => {
            const areaData = areaDoc.data();
            const areaId = areaDoc.id;

            // filtrar conteúdos que pertencem a esta area
            const conteudosDaArea = listConteudos.map(conteudoDoc => ({
                    id: conteudoDoc.id,
                    ...conteudoDoc.data()
                }))
                .filter(conteudo => conteudo.area?.id === areaId);

            // calculo dos conteúdos iniciados
            const totalConteudos = conteudosDaArea.length;
            const conteudosIniciados = conteudosDaArea.filter(c => c.status === "iniciado").length;
            const porcentagemIniciados = totalConteudos > 0
                ? Math.round((conteudosIniciados / totalConteudos) * 100)
                : 0;

            return {
                id: areaId,
                ...areaData,
                conteudos: conteudosDaArea,
                porcentagemIniciados
            };
        });

        console.log("Áreas organizadas com seus conteúdos e progresso:", organizados);
        setMaptConteudosAreas(organizados);
    }, [listAreas, listConteudos]);

    // buscar atividades
    useEffect(() => {
        const buscarAtividades = async () => {
            try {
                console.log("=== BUSCANDO ATIVIDADES ===");

                // buscar todas atividades
                const q = query(
                    collection(db, "atividade"),
                    orderBy("tempoInicio", "asc")
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    console.log("Nenhuma atividade encontrada");
                    setListAtividades([]);
                    return;
                }

                const atividades = await Promise.all(
                    snap.docs.map(async (docSnap) => {
                        const id = docSnap.id;
                        const dados = docSnap.data();

                        console.log("\n📌 ATIVIDADE ENCONTRADA:", id);
                        console.log("Raw data:", dados);

                        // converter datas
                        const tempoInicio = dados.tempoInicio?.toDate();
                        let tempoFim = dados.tempoFim?.toDate();

                        console.log("⏱️ Horários convertidos:");
                        console.log(" - Início:", tempoInicio?.toLocaleString("pt-BR"));
                        console.log(" - Fim:", tempoFim?.toLocaleString("pt-BR"));

                        // buscar nome da atividade (conteúdo)
                        let nome = "Sem nome";
                        if (dados.conteudo) {
                            const conteudoSnap = await getDoc(dados.conteudo);
                            nome = conteudoSnap.data()?.nome || "Sem nome";
                        }

                        console.log("📘 Nome do conteúdo:", nome);

                        // buscar nome da matéria
                        let materia = "Sem matéria";
                        if (dados.materia) {
                            const materiaSnap = await getDoc(dados.materia);
                            materia = materiaSnap.data()?.nome || "Sem matéria";
                        }

                        console.log("📚 Matéria:", materia);

                        // calcular fim da sessão para pomodoro
                        if (dados.tipoSessao === "pomodoro") {
                            const tempoEstudo = dados.tempoEstudo || 25;
                            const tempoPausa = dados.tempoPausa || 5;
                            const ciclos = dados.numCiclos || 1;

                            const totalMinutos = (tempoEstudo + tempoPausa) * ciclos - tempoPausa;
                            tempoFim = new Date(tempoInicio.getTime() + totalMinutos * 60000);

                            console.log("🍅 Pomodoro detectado!");
                            console.log(" - Tempo estudo:", tempoEstudo);
                            console.log(" - Tempo pausa:", tempoPausa);
                            console.log(" - Ciclos:", ciclos);
                            console.log(" - Novo tempoFim:", tempoFim.toLocaleString("pt-BR"));
                        }

                        // objeto final da atividade
                        const atividadeFormatada = {
                            id,
                            nome,
                            materia,
                            tempoInicio,
                            tempoFim,
                            tipoSessao: dados.tipoSessao || "normal"
                        };

                        console.log("✔️ Objeto final:", atividadeFormatada);

                        return atividadeFormatada;
                    })
                );

                console.log("\n=== TODAS ATIVIDADES FORMATADAS ===");
                console.log(atividades);

                // filtrar apenas atividades a partir de hoje
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                let resultados = atividades.filter(atv => {
                    if (!(atv.tempoInicio instanceof Date)) return false;
                    const inicio = new Date(atv.tempoInicio);
                    inicio.setHours(0, 0, 0, 0);
                    return inicio >= hoje;
                });

                console.log("\n🎯 Atividades filtradas (>= hoje):");
                console.log(resultados);

                // ordenar
                resultados.sort((a, b) => a.tempoInicio - b.tempoInicio);

                // limitar a 3 itens
                resultados = resultados.slice(0, 3);

                console.log("\n📌 ATIVIDADES EXIBIDAS NO APP (3 MAX):");
                console.log(resultados);

                setListAtividades(resultados);

            } catch (error) {
                console.error("❌ Erro ao buscar atividades:", error);
            }
        };

        buscarAtividades();
    }, []);

    // format hora
    function formatHora(date) {
        if (!date) return ""; // evita undefined
        const d = new Date(date);
        const h = d.getHours().toString().padStart(2, "0");
        const m = d.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView style={{ margin: 20 }}>
                <View style={{ gap: 30 }}>
                    {/* top */}
                    <View>
                        <Text
                            style={{
                                color: "#34445B",
                                fontSize: 30,
                                textAlign: "center",
                            }}
                        >
                            Dashboard
                        </Text>
                    </View>

                    {/* area streak */}
                    <View style={styles.containerStreak}>
                        {/* imagem */}
                        <TouchableOpacity onPress={() => setModalInfoFoguVisible(true)}>
                            <ImageBackground
                                source={
                                    foguinAceso ?
                                        require("../../../assets/foguu.gif") :
                                        require("../../../assets/fogo_azul.png")
                                }
                                style={styles.bgImageStreak}
                                resizeMode="contain"
                            >
                                <Text style={styles.numberStreak}>{sequenciaFoguinho}</Text>
                            </ImageBackground>
                        </TouchableOpacity>

                        {/* titulo + texto */}
                        <View style={styles.textsStreak}>
                            <Text style={styles.titleStreak}>Seu Streak</Text>
                            <Text style={styles.descriptionStreak}>
                                Mantenha seu streak estudando todos os dias!
                            </Text>
                        </View>
                    </View>

                    {/* area progresso geral */}
                    <View>
                        {/* titulo */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.title}>Progresso Geral</Text>
                        </View>

                        {/* list card areas */}
                        <View style={{ gap: 15 }}>
                            {
                                mapConteudosAreas.length === 0 ?
                                <Text style={{ textAlign: 'center', color: '#34445B' }}>Nenhuma área cadastrada.</Text>
                                :
                                mapConteudosAreas && mapConteudosAreas.map((area) => (
                                    <View key={area.id} style={styles.containerCard}>

                                        {/* card header */}
                                        <View style={styles.containerTitleCard}>
                                            <Text
                                                style={{
                                                    color: '#34445B',
                                                    fontWeight: 'bold',
                                                    marginBottom: 5
                                                }}
                                            >
                                                {area.nome}
                                            </Text>
                                            <Text>{area.porcentagemIniciados}%</Text>
                                        </View>

                                        {/* progress bar */}
                                        <View style={styles.containerProgressBar}>
                                            <View
                                                style={{
                                                    backgroundColor: '#34445B',
                                                    // height: 8,
                                                    flex: 1,
                                                    width: `${area.porcentagemIniciados}%`,
                                                    borderRadius: 5
                                                }}
                                            />
                                        </View>
                                    </View>
                                ))
                            }
                        </View>

                    </View>

                    {/* area proximas atividades */}
                    <View>
                        {/* titulo */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.title}>Próximas atividades</Text>
                        </View>

                        {/* list card atividades */}
                        <View style={{ gap: 15 }}>
                            {listAtividades.length == 0 ?
                                <Text style={{ textAlign: 'center', color: '#34445B' }}>Nenhuma atividade futura.</Text>
                                : listAtividades.map((atv, index) => (
                                    // card da atividade
                                    <View key={index} style={styles.containerCard}>
                                        <View style={styles.containerTitleCard}>
                                            <View>
                                                <Text
                                                    style={{
                                                        color: '#34445B',
                                                        fontWeight: 'bold',
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    {atv.nome}
                                                </Text>
                                                <Text>
                                                    {atv.materia} | {formatHora(atv.tempoInicio)} - {formatHora(atv.tempoFim)}
                                                </Text>
                                            </View>
                                            {/* label de hoje, amanhã ou N dias */}
                                            <LabelDia data={atv.tempoInicio} />
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </View>
                </View>
            </ScrollView >

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
                                            source={require("../../../assets/foguu.gif")}
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

            {/* modal foguin - ainda nao estudou hj */}
            <Modal
                visible={modalManterFoguinVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: "#1d8ab9" }]}>
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
                                    source={require("../../../assets/fogo_azul.png")}
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
                                    {/* Poxa, você perdeu seu foguinho de {sequenciaFoguinho} dias!! Mas não desanime! Recomece e mantenha sua jornada de estudos em frente! */}
                                    Você ainda não estudou hoje! Estude para manter seu foguinho aceso e continuar sua sequência de {sequenciaFoguinho} dia(s)!
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                padding: 10,
                                borderRadius: 10,
                                alignItems: 'center',
                            }}
                            onPress={() => setModalManterFoguinVisible(false)}
                        >
                            <Text>ENTENDI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* modal perdeu foguin sequencia */}
            <Modal
                visible={modalPerdeuFoguinVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: "#1d8ab9" }]}>
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
                                    source={require("../../../assets/fogo_azul.png")}
                                    // source={require("../../../assets/foguu.gif")}
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
                                    Poxa, você perdeu seu foguinho de {sequenciaFoguinho} dias!! Mas não desanime! Recomece e mantenha sua jornada de estudos em frente!
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#fff',
                                padding: 10,
                                borderRadius: 10,
                                alignItems: 'center',
                            }}
                            onPress={handleCloseModalPerdeuFoguin}
                        >
                            <Text>ENTENDI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    containerStreak: {
        // backgroundColor: '#ffd700',
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        gap: 15,
    },

    bgImageStreak: {
        // backgroundColor: '#ff6347',
        width: 120,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
    },

    numberStreak: {
        marginTop: 30,
        fontSize: 26,
        fontWeight: "bold",
        color: "#34445B",
    },
    textsStreak: {
        flex: 1,
    },
    titleStreak: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#34445B",
        textAlign: "left",
    },
    descriptionStreak: {
        textAlign: "left",
        color: "#34445B",
    },
    title: {
        textAlign: 'center',
        color: '#34445B',
        fontWeight: 'bold',
        fontSize: 20
    },
    containerCard: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 10
    },
    containerTitleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    containerProgressBar: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        height: 15,
        overflow: 'hidden',
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
})

