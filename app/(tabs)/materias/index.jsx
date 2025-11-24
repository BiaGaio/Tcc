import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from "../../../firebaseConf";
import { collection, query, getDocs, where, Timestamp, addDoc } from 'firebase/firestore';
import { Modal } from 'react-native';

import CardItemListAreaEConteudo from '../../components/materias/CardItemListAreaEConteudo';
import RadioButton from '../../components/forms/RadioButton';
import SelectField from '../../components/forms/SelectField';
import InputField from '../../components/forms/InputField';
import { ScrollView } from 'react-native';
import { CustomToast, showToast } from '../../components/CustomToast';

export default function Materias() {
    const router = useRouter();
    const auth = getAuth();

    // ---------- ESTADOS PRINCIPAIS ----------
    const [user, setUser] = useState(auth.currentUser);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Opção selecionada no modal ("area" ou "personalizada")
    const [selectedOption, setSelectedOption] = useState("area");

    // Estados de seleção
    const [areaSelecionada, setAreaSelecionada] = useState(null);
    const [materiaSelecionada, setMateriaSelecionada] = useState(null);
    const [inputField, setInputField] = useState(null);

    // Estados de input
    const [inputMateriaPersonalizada, setInputMateriaPersonalizada] = useState('');
    const [inputFieldPersonalizada, setInputFieldPersonalizada] = useState('');

    // Datasets carregados do Firestore
    const [datasetAreas, setDatasetAreas] = useState([]);
    const [datasetMaterias, setDatasetMaterias] = useState([]);
    const [datasetConteudos, setDatasetConteudos] = useState([]);

    // Estrutura geral de dados: { area: [materias...] }
    const [mapAreaMaterias, setMapAreaMaterias] = useState({});

    // ========================================================================
    // AUTENTICAÇÃO: Redireciona caso o usuário não esteja logado
    // ========================================================================
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (!u) router.replace("/");
            else setUser(u);
        });
        return unsubscribe;
    }, []);

    // ========================================================================
    // CARREGAR TODAS AS ÁREAS
    // ========================================================================
    useEffect(() => {
        if (!user) return;

        console.log('USER:', user.email);
        const fetchAreas = async () => {
            try {
                const q = query(
                    collection(db, "areas"),
                    where('user', '==', user.email)
                );

                const qSnapshot = await getDocs(q);

                const listaAreas = qSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDatasetAreas(listaAreas);
                console.log("Áreas carregadas:", listaAreas);
            } catch (err) {
                console.error("Erro ao buscar as áreas:", err);
            }
        };
        fetchAreas();
    }, [user]);

    // ========================================================================
    // CARREGAR TODAS AS MATÉRIAS AGRUPADAS POR ÁREA
    // ========================================================================
    useEffect(() => {
        if (!user || !datasetAreas || datasetAreas.length == 0) return;

        const fetchMateriasPorArea = async () => {
            try {
                const areasSnapshot = await getDocs(
                    collection(db, "areas"),
                    where('user', '==', user.email)
                );
                if (areasSnapshot.empty) {
                    console.warn("Nenhuma área encontrada.");
                    setMapAreaMaterias({});
                    return;
                }

                const mapa = {};
                // percorre todas as áreas
                for (const areaDoc of areasSnapshot.docs) {
                    const areaNome = areaDoc.data().nome;
                    const areaRef = areaDoc.ref;

                    const materiasQuery = query(
                        collection(db, "materias"),
                        where("area", "==", areaRef)
                    );
                    const materiasSnapshot = await getDocs(materiasQuery);
                    const materiasLista = materiasSnapshot.docs.map((m) => m.data().nome);

                    mapa[areaNome] = materiasLista;
                }

                setMapAreaMaterias(mapa);
                console.log("Mapa área → matérias:", mapa);
                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar matérias por área:", err);
            }
        };

        fetchMateriasPorArea();
    }, [datasetAreas]);

    // ========================================================================
    // BUSCAR MATÉRIAS FILTRADAS PELA ÁREA SELECIONADA (para o modal)
    // ========================================================================
    useEffect(() => {
        const fetchMateriasDaArea = async () => {
            if (!datasetAreas || datasetAreas.length == 0 || !areaSelecionada) return;

            try {
                // Busca referência da área
                const areaQuery = query(
                    collection(db, "areas"),
                    where("nome", "==", areaSelecionada),
                    where("user", "==", user.email)
                );
                const areaSnapshot = await getDocs(areaQuery);

                if (areaSnapshot.empty) {
                    console.warn("Nenhuma área encontrada com esse nome.");
                    setDatasetMaterias([]);
                    return;
                }

                const areaRef = areaSnapshot.docs[0].ref;

                // Busca matérias da área
                const materiaQuery = query(collection(db, "materias"), where("area", "==", areaRef));
                const materiaSnapshot = await getDocs(materiaQuery);

                const listaMaterias = materiaSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setDatasetMaterias(listaMaterias);
                console.log("Matérias da área selecionada:", listaMaterias);
            } catch (err) {
                console.error("Erro ao buscar as matérias:", err);
            }
        };

        fetchMateriasDaArea();
    }, [datasetAreas, areaSelecionada]);

    // ========================================================================
    // BUSCAR CONTEÚDOS (depende da área e matéria selecionadas)
    // ========================================================================
    useEffect(() => {
        const buscarConteudos = async () => {
            if (!user || !areaSelecionada || !materiaSelecionada) return;

            try {
                const areaQuery = query(
                    collection(db, "areas"),
                    where("nome", "==", areaSelecionada),
                    where("user", "==", user.email)
                );
                const areaSnapshot = await getDocs(areaQuery);
                const areaRef = areaSnapshot.docs[0]?.ref;

                const materiaQuery = query(
                    collection(db, "materias"),
                    where("nome", "==", materiaSelecionada)
                );
                const materiaSnapshot = await getDocs(materiaQuery);
                const materiaRef = materiaSnapshot.docs[0]?.ref;

                if (!areaRef || !materiaRef) {
                    console.warn("Área ou matéria não encontrada!");
                    setDatasetConteudos([]);
                    return;
                }

                const conteudoQuery = query(
                    collection(db, "conteudos"),
                    where("area", "==", areaRef),
                    where("materia", "==", materiaRef)
                );

                const conteudoSnapshot = await getDocs(conteudoQuery);
                const listaConteudos = conteudoSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setDatasetConteudos(listaConteudos);
                console.log("Conteúdos carregados:", listaConteudos);
            } catch (err) {
                console.error("Erro ao buscar os conteúdos:", err);
            }
        };

        buscarConteudos();
    }, [areaSelecionada, materiaSelecionada]);

    // ========================================================================
    // ABRIR DETALHES DE UMA ÁREA
    // ========================================================================
    const abrirDetalhes = (nomeArea) => {
        console.log("Abrindo detalhes da área:", nomeArea);
        // console.log(mapAreaMaterias[nomeArea]);
        router.push({
            pathname: `/materias/${nomeArea}`,
        });
    };

    // salvar conteudo
    const salvarConteudo = async () => {
        if (!user) return;

        if (selectedOption === "area") {
            // buscar areaRef
            const qArea = query(
                collection(db, "areas"),
                where("nome", "==", areaSelecionada),
                where("user", "==", user.email)
            );

            const areaSnap = await getDocs(qArea);

            if (areaSnap.empty) {
                console.warn("Área não encontrada:", areaSelecionada);
                return;
            }

            const areaRef = areaSnap.docs[0].ref;

            // buscar areaRef
            const qMateria = query(
                collection(db, "materias"),
                where("nome", "==", materiaSelecionada),
                where("area", "==", areaRef),
            );

            const materiaSnap = await getDocs(qMateria);

            if (materiaSnap.empty) {
                console.warn("Matéria não encontrada:", materiaSelecionada);
                return;
            }

            const materiaRef = materiaSnap.docs[0].ref;

            // salvar conteudo
            try {
                const novoConteudo = {
                    nome: inputField,
                    area: areaRef,
                    materia: materiaRef,
                    status: "não iniciado",
                    // criadoEm: Timestamp.now(),
                };

                const docRef = await addDoc(collection(db, "conteudos"), novoConteudo);

                console.log("Conteúdo salvo com sucesso! ID:", docRef.id);
                setModalVisible(false);
                showToast("sucesso", "Conteúdo criado!", "o conteúdo foi cadastrado no sistema!");
            } catch (error) {
                showToast("erro", "Erro ao salvar conteúdo!", "Não foi possível cadastrar o conteúdo no sistema!");
                console.error("Erro ao salvar conteúdo:", error);
            }
        }
        else {
            // buscar areaRef de "Personalizada"
            const qArea = query(
                collection(db, "areas"),
                where("nome", "==", "Personalizada"),
                where("user", "==", user.email)
            );
            const areaSnap = await getDocs(qArea);
            const areaRef = !areaSnap.empty ? areaSnap.docs[0].ref : null;

            // criar materia
            const materiaObj = {
                area: areaRef,
                nome: inputMateriaPersonalizada
            }
            const materiaRef = await addDoc(collection(db, "materias"), materiaObj);

            console.log('--------------------------------------------------------------');
            console.log('Salvar estes dados...');
            console.log('areaRef: ', areaRef);
            console.log('materia: ', inputMateriaPersonalizada);
            console.log('materiaRef: ', materiaRef);
            console.log('conteudo: ', inputFieldPersonalizada);
            console.log('--------------------------------------------------------------');

            // salvar conteudo
            try {
                const novoConteudo = {
                    area: areaRef,
                    materia: materiaRef,
                    nome: inputFieldPersonalizada,
                    status: "não iniciado",
                };

                const docRef = await addDoc(collection(db, "conteudos"), novoConteudo);

                console.log("Conteúdo salvo com sucesso! ID:", docRef.id);
                setModalVisible(false);
            } catch (error) {
                console.error("Erro ao salvar conteúdo:", error);
            }
        }
    };

    // ========================================================================
    // RENDERIZAÇÃO
    // ========================================================================
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView>
                <View style={styles.container}>
                    <Text style={styles.title}>Matérias e Conteúdos</Text>

                    {/* Botão de abrir modal */}
                    <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                        <View style={{ flexDirection: "row", alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="add" size={20} color="#fff" />
                            <Text style={{ color: "#fff" }}>Adicionar</Text>
                        </View>
                    </TouchableOpacity>

                    {/* modal add conteudo */}
                    <Modal
                        visible={modalVisible}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                <ScrollView>
                                    <Text style={styles.modalTitle}>Adicionar conteúdo</Text>
                                    {/* Radio Buttons */}
                                    <Text>Adicione um novo conteúdo para acompanhar seu progresso.</Text>
                                    <View style={{ marginTop: 20, gap: 10 }}>
                                        <RadioButton
                                            label="Selecionar Área, matéria e conteúdo"
                                            selected={selectedOption === "area"}
                                            onSelected={() => setSelectedOption("area")}
                                        />
                                        <RadioButton
                                            label="Matéria Personalizada"
                                            selected={selectedOption === "personalizada"}
                                            onSelected={() => setSelectedOption("personalizada")}
                                        />
                                    </View>

                                    {/* Campos de seleção dinâmicos */}
                                    {selectedOption === "area" && (
                                        <View style={{ marginTop: 20, gap: 10 }}>
                                            <SelectField
                                                label="Área"
                                                placeholder="Selecione uma área"
                                                options={datasetAreas.map(area => area.nome)}
                                                selected={areaSelecionada}
                                                onSelect={setAreaSelecionada}
                                            />
                                            <SelectField
                                                label="Matéria"
                                                placeholder="Selecione uma matéria"
                                                options={datasetMaterias.map(m => m.nome)}
                                                selected={materiaSelecionada}
                                                onSelect={setMateriaSelecionada}
                                            />
                                            <InputField
                                                label="Conteúdo"
                                                value={inputField}
                                                onChangeText={setInputField}
                                                placeholder="Digite o conteúdo"
                                            />
                                        </View>
                                    )}
                                    {selectedOption === "personalizada" && (
                                        <View style={{ marginTop: 20, gap: 10 }}>
                                            <InputField
                                                label="Matéria"
                                                value={inputMateriaPersonalizada}
                                                onChangeText={setInputMateriaPersonalizada}
                                                placeholder="Digite a matéria"
                                            />
                                            <InputField
                                                label="Conteúdo"
                                                value={inputFieldPersonalizada}
                                                onChangeText={setInputFieldPersonalizada}
                                                placeholder="Digite o conteúdo"
                                            />
                                        </View>
                                    )}

                                    {/* botao salvar */}
                                    <View style={{ marginTop: 20 }}>
                                        <TouchableOpacity style={styles.button} onPress={salvarConteudo}>
                                            <Text style={{ color: "#fff" }}>Salvar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/* ---------------- LISTA DE CARDS ---------------- */}
                    {
                        Object.keys(mapAreaMaterias).map((area, index) => (
                            <TouchableOpacity key={index} onPress={() => abrirDetalhes(area)}>
                                <CardItemListAreaEConteudo
                                    title={area}
                                    numMaterias={mapAreaMaterias[area]?.length || 0}
                                />
                            </TouchableOpacity>
                        ))
                    }
                </View>
            </ScrollView>
            <CustomToast />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 25,
        marginBottom: 0,
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
    },
});
