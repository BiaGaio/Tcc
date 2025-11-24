import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from '../../components/forms/Checkbox';
import { db } from "../../../firebaseConf";
import { collection, getDoc, getDocs, query, where } from 'firebase/firestore';

export default function Progresso() {
    const router = useRouter();
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);
    const [modalVisibleFiltro, setModalVisibleFiltro] = useState(false);
    const [modalVisibleDadosMateria, setModalVisibleDadosMateria] = useState(false);
    const [materia, setMateria] = useState(null);
    const [listMaterias, setListMaterias] = useState([]);
    const [listCopyToFilterMaterias, setListCopyToFilterMaterias] = useState([]);
    const [mapMateriaConteudos, setMapMateriaConteudos] = useState({});
    const [porcentagemTotalConteudos, setPorcentagemTotalConteudos] = useState(0);
    const [numQuestoesResolvidas, setNumQuestoesResolvidas] = useState(0);
    // para facilitar a conta
    const [listSessoesConteudos, setListSessoesConteudos] = useState([]);
    const [listCardConteudosModal, setListCardConteudosModal] = useState([]);
    const [mapMateriaCheckbox, setMapMateriaCheckbox] = useState({});

    // verificar autenticacao
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

    // obter materias
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 1️⃣ Buscar as áreas que pertencem ao usuário
                const qAreas = query(
                    collection(db, "areas"),
                    where("user", "==", user.email)
                );

                const areasSnap = await getDocs(qAreas);
                if (areasSnap.empty) {
                    console.log("⚠️ Nenhuma área encontrada para este usuário.");
                    setListMaterias([]);
                    return;
                }

                // 2️⃣ Extrair as referências das áreas
                const areaRefs = areasSnap.docs.map(doc => doc.ref);

                // 3️⃣ Buscar matérias cujas áreas estão nessas referências
                const qMaterias = query(
                    collection(db, "materias"),
                    where("area", "in", areaRefs)
                );

                const materiaSnap = await getDocs(qMaterias);
                console.log("📄 materiaSnap size:", materiaSnap.size);

                if (materiaSnap.empty) {
                    console.log("⚠️ Nenhuma matéria encontrada.");
                    setListMaterias([]);
                    return;
                }

                const listaFirebase = materiaSnap.docs.map(m => ({
                    ref: m.ref,
                    id: m.id,
                    numConteudos: 0,
                    conteudosIniciados: 0,
                    ...m.data(),
                }));

                console.log("✅ Matérias carregadas:", listaFirebase);

                // criar mapa de matérias por nome
                const obj = {};
                listaFirebase.forEach((m) => {
                    obj[m.nome] = true;
                });

                setMapMateriaCheckbox(obj);
                setListMaterias(listaFirebase);
                setListCopyToFilterMaterias(listaFirebase);

            } catch (err) {
                console.error("❌ Erro ao obter as matérias:", err);
            }
        };

        fetchData();
    }, [user]);


    // obter os conteúdos das mateŕias
    useEffect(() => {
        if (!user || !listMaterias?.length) return;

        console.log('🔍 Consultando os conteúdos das mateŕias')

        const fetchData = async () => {
            try {
                const qConteudos = query(collection(db, "conteudos"));
                const conteudosSnap = await getDocs(qConteudos);

                if (conteudosSnap.empty) {
                    console.warn("Nenhum conteúdo encontrado no Firestore.");
                    setMapMateriaConteudos({});
                    return;
                }

                const listaFirebase = conteudosSnap.docs;
                const tempMapMateriaConteudos = {};

                // Logs para debug
                console.log("🧩 Materias disponíveis:");
                listMaterias.forEach(m =>
                    console.log(`  - ${m.nome} (id: ${m.ref?.id}, path: ${m.ref?.path})`)
                );

                listaFirebase.forEach(obj => {
                    const conteudo = obj.data();
                    const materiaRef = conteudo.materia;

                    console.log(`📘 Conteúdo: ${conteudo.nome}`);
                    console.log("   ↳ materiaRef:", materiaRef?.path || materiaRef?.id);

                    if (!materiaRef) return; // pula se não houver referência

                    // 🔍 Comparar pelo ID do documento (mais seguro)
                    const materiaEncontrada = listMaterias.find(
                        m => m.ref?.id === materiaRef?.id
                    );

                    if (!materiaEncontrada) {
                        console.warn("⚠️ Matéria não encontrada para o conteúdo:", conteudo.nome);
                        return; // pula esse conteúdo
                    }

                    const materiaNome = materiaEncontrada.nome;

                    if (!tempMapMateriaConteudos[materiaNome]) {
                        tempMapMateriaConteudos[materiaNome] = [conteudo];
                    } else {
                        tempMapMateriaConteudos[materiaNome].push(conteudo);
                    }
                });

                console.log("✅ tempMapMateriaConteudos final:", tempMapMateriaConteudos);
                setMapMateriaConteudos(tempMapMateriaConteudos);

            } catch (err) {
                console.error("❌ Erro ao obter os conteúdos:", err);
            }
        };

        fetchData();
    }, [user, listMaterias]);

    // recalcular progresso: contar numConteudos e conteudosIniciados para cada matéria
    useEffect(() => {
        if (!user) return;
        if (!listCopyToFilterMaterias || !mapMateriaConteudos) return;

        console.log('####################################################');
        console.log("📘 Recalculando progresso das matérias...");
        console.log("📚 Total de matérias:", listCopyToFilterMaterias.length);
        console.log("🧩 Mapeamento atual de conteúdos:", mapMateriaConteudos);
        console.log('fim-listCopyToFilterMaterias: ', listCopyToFilterMaterias)

        let totalConteudosGeral = 0;
        let totalIniciadosGeral = 0;
        let houveAlteracao = false;

        const materiasAtualizadas = listCopyToFilterMaterias.map((m) => {
            const conteudos = mapMateriaConteudos[m.nome] || [];

            const totalConteudos = conteudos.length;
            const iniciados = conteudos.filter((c) => c.status === "iniciado").length;

            totalConteudosGeral += totalConteudos;
            totalIniciadosGeral += iniciados;

            console.log(`\n📖 Matéria: ${m.nome}`);
            console.log(`   • Conteúdos totais: ${totalConteudos}`);
            console.log(`   • Conteúdos iniciados: ${iniciados}`);

            if (
                m.numConteudos !== totalConteudos ||
                m.conteudosIniciados !== iniciados
            ) {
                houveAlteracao = true;
                return { ...m, numConteudos: totalConteudos, conteudosIniciados: iniciados };
            }

            return m;
        });

        // calcula a porcentagem geral de progresso (total de conteúdos iniciados / total geral)
        const porcentagemGeral =
            totalConteudosGeral > 0
                ? ((totalIniciadosGeral / totalConteudosGeral) * 100).toFixed(0)
                : 0;

        console.log("\n📈 Totais gerais:");
        console.log(`   • Conteúdos iniciados: ${totalIniciadosGeral}`);
        console.log(`   • Conteúdos totais: ${totalConteudosGeral}`);
        console.log(`   • Porcentagem geral: ${porcentagemGeral}%`);

        setPorcentagemTotalConteudos(porcentagemGeral);

        if (houveAlteracao) {
            const isIgual =
                JSON.stringify(listMaterias) === JSON.stringify(materiasAtualizadas);
            if (!isIgual) {
                console.log("🔁 Atualizando lista de matérias com novos totais...");
                setListMaterias(materiasAtualizadas);
                setListCopyToFilterMaterias(materiasAtualizadas);
            } else {
                console.log("✅ Nenhuma mudança nos números detectada (comparação profunda).");
            }
        }
        console.log('Progresso calculado !!!');
        console.log('fim-listCopyToFilterMaterias: ', listCopyToFilterMaterias)
        console.log('####################################################');

    }, [user, listCopyToFilterMaterias, mapMateriaConteudos]);

    // buscar sessões e contar numero de questoes resolvidas
    useEffect(() => {
        if (!user) return;

        const nomeColecoesSessoes = ["sessaoEstudo", "sessaoEstudoPomodoro"];

        const fetchAll = async () => {
            console.log("📊 Iniciando busca de sessões do usuário:", user.email);

            try {
                // 1️⃣ Busca todas as coleções em paralelo
                const resultados = await Promise.all(
                    nomeColecoesSessoes.map(async (colecao) => {
                        console.log(`🔍 Buscando na coleção "${colecao}"...`);

                        const qSessao = query(
                            collection(db, colecao),
                            where("user", "==", user.email)
                        );

                        const snap = await getDocs(qSessao);
                        if (snap.empty) {
                            console.log(`⚠️ Nenhuma sessão encontrada em "${colecao}".`);
                            return [];
                        }

                        // 2️⃣ Resolve os DocumentReference do campo "conteudo"
                        const sessoes = await Promise.all(
                            snap.docs.map(async (doc) => {
                                const data = doc.data();
                                let materiaNome = null;

                                if (data.conteudo) {
                                    try {
                                        const conteudoSnap = await getDoc(data.conteudo);
                                        if (conteudoSnap.exists()) {
                                            const materiaRef = conteudoSnap.data().materia;

                                            if (materiaRef) {
                                                const materiaSnap = await getDoc(materiaRef);

                                                if (materiaSnap.exists()) {
                                                    materiaNome = materiaSnap.data().nome;
                                                    console.log('📘 Matéria encontrada:', materiaNome);
                                                } else {
                                                    console.warn('⚠️ Referência de matéria não encontrada para:', data);
                                                }
                                            } else {
                                                console.warn('⚠️ Campo "materia" ausente em conteudo:', data);
                                            }
                                        } else {
                                            console.warn('⚠️ Documento "conteudo" inexistente:', data.conteudo?.path);
                                        }
                                    } catch (err) {
                                        console.error("❌ Erro ao buscar conteúdo ou matéria:", err);
                                    }
                                }

                                return {
                                    id: doc.id,
                                    ...data,
                                    materiaNome,
                                    colecao,
                                };
                            })
                        );

                        return sessoes;
                    })
                );

                // 3️⃣ Junta tudo
                const todasSessoes = resultados.flat();

                console.log("📚 Total de sessões obtidas:", todasSessoes);
                setListSessoesConteudos(todasSessoes);

            } catch (error) {
                console.error("❌ Erro geral ao buscar sessões:", error);
            }
        };

        fetchAll();
    }, [user]); // 🔁 Executa só quando o usuário muda

    // calcular numero de questoes resolvidas
    useEffect(() => {
        if (!listSessoesConteudos?.length || !listCopyToFilterMaterias?.length) {
            setNumQuestoesResolvidas(0);
            return;
        }

        console.log("(re)calculando as questões...");

        const nomesMaterias = listCopyToFilterMaterias.map((m) => m.nome);

        // Filtra as sessões com matérias válidas
        const sessoesFiltradas = listSessoesConteudos.filter((s) =>
            nomesMaterias.includes(s.materiaNome)
        );

        console.log(
            `🎯 Sessões filtradas (${sessoesFiltradas.length}):`,
            sessoesFiltradas.map((s) => s.materiaNome)
        );

        // Soma o total de questões resolvidas
        const total = sessoesFiltradas.reduce((soma, sessao, idx) => {
            const num = Number(sessao.numQuestoesResolvidas) || 0;
            console.log(`   #${idx + 1} -> ${sessao.materiaNome || "?"}: ${num}`);
            return soma + num;
        }, 0);

        console.log(`✅ Total de questões resolvidas: ${total}`);
        setNumQuestoesResolvidas(total);
    }, [listSessoesConteudos, listCopyToFilterMaterias]);

    // aplicar o filtro
    const aplicarFiltro = () => {
        console.log('aplicar filtro');
        setModalVisibleFiltro(false);

        // filtra as matérias que estão com checkbox ativo
        const listaFiltrada = listMaterias.filter(
            materia => mapMateriaCheckbox[materia.nome]
        );

        // atualiza a interface
        setListCopyToFilterMaterias(listaFiltrada);

        console.log('materias do filtro: ', listaFiltrada);
    }

    // atualiza status do checkbox
    const setStatusCheckbox = (label, status) => {
        console.log(`[${label}]: ${status}`);
        setMapMateriaCheckbox(prev => ({
            ...prev,
            [label]: status
        }));
    }

    // ajustar dados do modal
    const abrirModalDetalhes = async (materia) => {
        // Define a matéria selecionada
        setMateria(materia.nome);

        // Copia os conteúdos da matéria
        const conteudosTemp = [...mapMateriaConteudos[materia.nome]];

        // Calcula a porcentagem de conteúdos iniciados (opcional)
        const iniciados = conteudosTemp.filter(c => c.status === "iniciado").length;
        const totalConteudos = conteudosTemp.length;
        const porcentagem = totalConteudos > 0 ? ((iniciados / totalConteudos) * 100).toFixed(0) : 0;

        // --- Busca dados adicionais das coleções do Firestore ---
        const nomeColecoesSessoes = ["sessaoEstudo", "sessaoEstudoPomodoro"];

        // Cria um array de conteúdos com as informações iniciais
        const listaConteudos = conteudosTemp.map(conteudo => ({
            nome: conteudo.nome,
            numQuestoesResolvidas: conteudo.numQuestoesResolvidas || 0,
            numQuestoesCorretas: conteudo.numQuestoesCorretas || 0,
        }));

        // Para cada coleção, busca sessões e soma questões de cada conteúdo
        for (const colecao of nomeColecoesSessoes) {
            const qSessao = query(
                collection(db, colecao),
                where("user", "==", user.email),
            );

            const sessaoSnap = await getDocs(qSessao);

            if (!sessaoSnap.empty) {
                for (const docSnap of sessaoSnap.docs) {
                    const data = docSnap.data();

                    // verifica se existe o ref do conteúdo
                    if (data.conteudo) {
                        console.log("data.conteudo: ", data.conteudo)
                        try {
                            // busca o documento referenciado
                            const conteudoRef = data.conteudo;
                            const conteudoDoc = await getDoc(conteudoRef);
                            console.log("conteudoDoc: ", conteudoDoc)

                            if (conteudoDoc.exists()) {
                                const nomeConteudo = conteudoDoc.data().nome;
                                console.log("nomeConteudo: ", nomeConteudo)

                                // procura o conteúdo correspondente na lista
                                const conteudoEncontrado = listaConteudos.find(c => c.nome === nomeConteudo);

                                if (conteudoEncontrado) {
                                    conteudoEncontrado.numQuestoesResolvidas += data.numQuestoesResolvidas || 0;
                                    conteudoEncontrado.numQuestoesCorretas += data.numQuestoesCorretas || 0;
                                }
                            }
                        } catch (error) {
                            console.error("Erro ao buscar conteúdo referenciado:", error);
                        }
                    }
                }
            }
        }

        // Atualiza o estado com a nova lista formatada
        setListCardConteudosModal(listaConteudos);

        // Logs pra depuração
        console.log("Matéria:", materia.nome);
        console.log("Porcentagem de conteúdos iniciados:", porcentagem + "%");
        console.log("Lista de conteúdos para o modal:", listaConteudos);

        // Abre o modal
        setModalVisibleDadosMateria(true);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView>
                <View style={styles.container}>
                    <Text style={styles.title}>Progresso</Text>

                    {/* Botão de abrir modal */}
                    <TouchableOpacity style={styles.button} onPress={() => setModalVisibleFiltro(true)}>
                        <View style={{ flexDirection: "row", alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="search" size={20} color="#fff" />
                            <Text style={{ color: "#fff" }}>Gerenciar matérias</Text>
                        </View>
                    </TouchableOpacity>

                    {/* modal filtro */}
                    <Modal
                        visible={modalVisibleFiltro}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisibleFiltro(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Gerenciar matérias</Text>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleFiltro(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                <Text style={{ textAlign: 'center' }}>
                                    Selecione as matérias que você deseja visualizar seu progresso
                                </Text>

                                {/* list checkbox */}
                                <View style={{ marginVertical: 20, gap: 5 }}>
                                    {listMaterias.map((materia) => (
                                        <Checkbox
                                            key={materia.id}
                                            label={materia.nome}
                                            checked={mapMateriaCheckbox[materia.nome] ?? true}
                                            onPress={() => {
                                                const novoStatus = !mapMateriaCheckbox[materia.nome];
                                                setStatusCheckbox(materia.nome, novoStatus);
                                            }}
                                        />
                                    ))}
                                </View>

                                <View>
                                    <TouchableOpacity style={styles.button} onPress={aplicarFiltro}>
                                        <Text style={{ color: "#fff" }}>Aplicar filtro</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* modal dados materia */}
                    <Modal
                        visible={modalVisibleDadosMateria}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisibleDadosMateria(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{materia}</Text>
                                <Text style={{ textAlign: 'center' }}>Progresso detalhado por conteúdo</Text>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleDadosMateria(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                {/* list conteudos */}

                                {
                                    listCardConteudosModal.map((conteudo, index) => (
                                        <View style={{ marginTop: 10 }} key={index}>
                                            <View style={styles.cardConteudoDetalhado}>
                                                <Text
                                                    style={{ color: '#34445B', fontSize: 15, fontWeight: 'bold' }}
                                                >
                                                    {conteudo.nome}
                                                </Text>

                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5 }}>
                                                    <Text
                                                        style={{
                                                            borderWidth: 2,
                                                            borderColor: '#34445B',
                                                            borderRadius: 10,
                                                            padding: 2,
                                                            paddingHorizontal: 4
                                                        }}
                                                    >
                                                        {
                                                            isNaN((conteudo.numQuestoesCorretas / conteudo.numQuestoesResolvidas)) ? 0 :
                                                                ((conteudo.numQuestoesCorretas / conteudo.numQuestoesResolvidas) * 100).toFixed(0)
                                                        }%
                                                    </Text>
                                                    {/* checked */}
                                                    {/* <View style={styles.iconIsChecked}>
                                                        <MaterialIcons name="check" size={20} color="lightblue" />
                                                    </View> */}

                                                    {/* not cheked */}
                                                    <View style={styles.iconIsNotChecked}>
                                                        <MaterialIcons name="check" size={20} color="#34445B" />
                                                    </View>
                                                </View>

                                                {/* progressbar */}
                                                <View style={{ marginTop: 10 }}>
                                                    <View style={[styles.containerProgressBar, { height: 12 }]}>
                                                        <View
                                                            style={{
                                                                height: '100%',
                                                                borderRadius: 10,
                                                                backgroundColor: '#34445B',
                                                                width: `${isNaN(((conteudo.numQuestoesCorretas / conteudo.numQuestoesResolvidas) * 100)) ? 0 : ((conteudo.numQuestoesCorretas / conteudo.numQuestoesResolvidas) * 100)}%`,
                                                            }}
                                                        />
                                                    </View>
                                                </View>

                                                <View style={{ marginTop: 5 }}>
                                                    <Text
                                                        styl={{ color: '#34445B' }}>
                                                        Acertos: {conteudo.numQuestoesCorretas}/{conteudo.numQuestoesResolvidas}
                                                    </Text>

                                                    {/* <Text>
                                                        Último estudo: 6 dia atrás
                                                    </Text> */}
                                                </View>


                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </View>
                    </Modal>


                    {/* card header */}
                    <View style={styles.cardHeader}>
                        <Text style={{ color: '#34445B', fontWeight: 'bold', fontSize: 15 }}>Progresso Geral</Text>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text>
                                Você completou {porcentagemTotalConteudos}% do conteúdo nas matérias selecionadas
                            </Text>
                            <Text style={{ fontWeight: 'bold' }}>{porcentagemTotalConteudos}%</Text>
                        </View>

                        {/* progressbar */}
                        <View style={{ marginTop: 10 }}>
                            <View style={styles.containerProgressBar}>
                                <View
                                    style={{
                                        height: '100%',
                                        borderRadius: 10,
                                        backgroundColor: '#34445B',
                                        width: `${porcentagemTotalConteudos}%`,
                                    }}
                                />
                            </View>
                        </View>

                        {/* num materias selecionadas */}
                        <View style={styles.miniCardContainer}>
                            <View style={styles.miniCard}>
                                <MaterialIcons name='menu-book' size={30} color='#34445B' />
                                <View style={styles.miniCardContent}>
                                    <Text style={styles.miniCardLabel}>Matérias selecionadas</Text>
                                    <Text style={styles.miniCardValue}>{listCopyToFilterMaterias.length}</Text>
                                </View>
                            </View>

                            <View style={styles.miniCard}>
                                <MaterialIcons name='check-circle' size={30} color='#34445B' />
                                <View style={styles.miniCardContent}>
                                    <Text style={styles.miniCardLabel}>Questões resolvidas</Text>
                                    <Text style={styles.miniCardValue}>{numQuestoesResolvidas}</Text>
                                </View>
                            </View>
                        </View>
                    </View>


                    {/* list materias */}
                    <View style={{ gap: 10 }}>
                        {
                            listCopyToFilterMaterias.map((materia, index) =>
                            (
                                <TouchableOpacity style={styles.cardMateria} key={index} onPress={() => abrirModalDetalhes(materia)}>
                                    <View>
                                        <Text>{materia.nome}</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text>{materia.conteudosIniciados} de {materia.numConteudos} conteúdos iniciados</Text>
                                        <Text style={styles.numPercent}>
                                            {
                                                isNaN(materia.conteudosIniciados / materia.numConteudos) ? 0 :
                                                    ((materia.conteudosIniciados / materia.numConteudos) * 100).toFixed(0)
                                            }
                                            %
                                        </Text>
                                    </View>

                                    <View>
                                        <View>
                                            <View style={styles.containerProgressBar}>
                                                <View
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 10,
                                                        backgroundColor: '#34445B',
                                                        width: `${((materia.conteudosIniciados / materia.numConteudos) * 100).toFixed(0)}%`,
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        }
                    </View>
                </View>
            </ScrollView>
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
    },
    button: {
        backgroundColor: "#34445B",
        padding: 10,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
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
    cardHeader: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 10,
    },
    containerProgressBar: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        height: 15,
        overflow: 'hidden',
    },
    miniCardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        flexWrap: 'wrap',
        gap: 10,
    },
    miniCard: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: 10,
        flex: 1,
        minWidth: 140,
    },
    miniCardContent: {
        flexShrink: 1,
        flex: 1,
    },
    miniCardLabel: {
        textAlign: 'center',
        flexWrap: 'wrap',
        fontSize: 14,
    },
    miniCardValue: {
        color: '#34445B',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 25,
    },
    // cardMateria
    cardMateria: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 10,
        gap: 10
    },
    numPercent: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 2
    },
    // cardConteudoDetalhado
    cardConteudoDetalhado: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 10,
    },
    iconIsChecked: {
        backgroundColor: '#34445B',
        borderRadius: 5,
        paddingHorizontal: 3
    },
    iconIsNotChecked: {
        borderWidth: 2,
        borderColor: '#34445B',
        borderRadius: 5,
        paddingHorizontal: 3
    }
});
