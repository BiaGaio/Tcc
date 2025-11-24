import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import Checkbox from "../forms/Checkbox";
import { MaterialIcons } from "@expo/vector-icons";
import { db } from "../../../firebaseConf";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import InputField from "../forms/InputField";
import { router } from "expo-router";

export default function CardMateriaConteudo({ title, conteudos, listMaterias, setListMaterias, setConteudos, showToast }) {
    const [conteudosLocais, setConteudosLocais] = useState(conteudos);
    const [numConteudosIniciados, setNumConteudosIniciados] = useState(0);
    const [numConteudosTotal, setNumConteudosTotal] = useState(0);
    const [porcentagemConteudos, setPorcentagemConteudos] = useState(0);
    const [modalVisibleInfo, setModalVisibleInfo] = useState(false);
    const [modalVisibleDeleteConteudo, setModalVisibleDeleteConteudo] = useState(false);
    const [modalVisibleEditarMateria, setModalVisibleEditarMateria] = useState(false);
    const [modalVisibleDeleteMateria, setModalVisibleDeleteMateria] = useState(false);
    const [modalVisibleEditarConteudo, setModalVisibleEditarConteudo] = useState(false);
    // const [listMaterias, setListMaterias] = useState(null);
    const [nomeArea, setNomeArea] = useState(null);
    const [nomeMateriaAtualizado, setNomeMateriaAtualizado] = useState(null);
    const [materiaSelecionada, setMateriaSelecionada] = useState(null);

    const [nomeConteudoAtualizado, setNomeConteudoAtualizado] = useState(null);
    const [conteudoSelecionado, setConteudoSelecionado] = useState(null);

    const [listConteudosObj, setListConteudosObj] = useState([]);
    const [loading, setLoading] = useState(true);
    const [numQuestoesCorretas, setNumQuestoesCorretas] = useState(0);
    const [numQuestoesResolvidas, setNumQuestoesResolvidas] = useState(0);
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);

    // autenticação
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

    // abrir modal excluir conteudo
    const abrirModalExcluirConteudo = (conteudo) => {
        setConteudoSelecionado(conteudo);
        setModalVisibleDeleteConteudo(true);
        console.log('conteudoSelecionado: ', conteudo);
    };

    // abrir modal editar materia
    const abrirModalEditarMateria = (nomeMateria) => {
        console.log("====================================");
        console.log(`      ABRINDO MODAL EDIT -> ${nomeMateria}`);
        console.log("====================================");

        // buscar a materia pelo nome localmente
        const materia = listMaterias.filter(materia => materia.nome === nomeMateria)[0];
        console.log('after filter: ', listMaterias);
        console.log('achouu: ', materia);
        setNomeMateriaAtualizado(materia?.nome);
        setMateriaSelecionada(materia);
        setModalVisibleInfo(false);
        setModalVisibleEditarMateria(true);
    }

    // abrir modal editar conteudo
    const abrirModalEditarConteudo = (nomeConteudo) => {
        const conteudo = conteudosLocais.filter(c => c.nome === nomeConteudo.nome)[0];
        setNomeConteudoAtualizado(conteudo?.nome);
        setConteudoSelecionado(conteudo);
        setModalVisibleEditarConteudo(true);
        console.log('conteudoSelecionado: ', conteudo);
    };

    // abrir modal excluir materia
    const abrirModalDeleteMateria = (nomeMateria) => {
        console.log("====================================");
        console.log(`      ABRINDO MODAL DELETE -> ${nomeMateria}`);
        console.log("====================================");

        // buscar a materia pelo nome localmente
        const materia = listMaterias.filter(materia => materia.nome === nomeMateria)[0];
        console.log('aftr filter: ', listMaterias);
        console.log('achouu: ', materia?.nome);
        setMateriaSelecionada(materia);
        setModalVisibleInfo(false);
        setModalVisibleDeleteMateria(true);
    }

    // excluir conteudo
    const excluirConteudo = async (conteudoID) => {
        try {
            const conteudoRef = doc(db, "conteudos", conteudoID);
            await deleteDoc(conteudoRef);

            setConteudosLocais(prev => prev.filter(c => c.id !== conteudoID));
            
            console.log(`✅ Conteúdo ${conteudoID} excluído com sucesso!`);

            showToast("sucesso", "Conteúdo excluído", "O conteúdo foi removido corretamente.");
        } catch (error) {
            console.error("❌ Erro ao excluir conteúdo:", error);
            showToast("erro", "Erro ao excluir conteúdo", "Não foi possível excluir este conteúdo.");
        }
    }

    // excluir materia
    const excluirMateria = async (materiaID) => {
        try {
            const materiaRef = doc(db, "materias", materiaID);
            await deleteDoc(materiaRef);

            setListMaterias(prev => prev.filter(m => m.id !== materiaID));
            console.log(`✅ Matéria ${materiaID} excluída com sucesso!`);

            showToast("sucesso", "Matéria excluída", "A matéria foi removida corretamente.");
        } catch (error) {
            console.error("❌ Erro ao excluir matéria:", error);
            showToast("erro", "Erro ao excluir matéria", "Não foi possível excluir esta matéria.");
        }
    }

    // 🔄 Sincroniza o estado local quando o pai muda
    useEffect(() => {
        setConteudosLocais(conteudos || []);
    }, [conteudos]);

    useEffect(() => {
        if (!conteudosLocais) return;

        const total = conteudosLocais.length;
        const iniciados = conteudosLocais.filter((c) => c.status === "iniciado").length;
        const porcentagem = total > 0 ? (iniciados / total) * 100 : 0;

        setNumConteudosIniciados(iniciados);
        setNumConteudosTotal(total);
        setPorcentagemConteudos(Math.round(porcentagem));

        const simplificar = async () => {
            const lista = [];
            let area = nomeArea; // usa o nome da área já carregado, se existir

            // Buscar a área apenas uma vez (do primeiro conteúdo)
            if (!area && conteudosLocais.length > 0) {
                const primeiroConteudo = conteudosLocais[0];
                const areaSnap = await getDoc(primeiroConteudo.area);
                area = areaSnap.exists() ? areaSnap.data().nome : "Área não encontrada";
                setNomeArea(area); // seta só uma vez
            }

            // agora monta a lista
            for (const conteudo of conteudosLocais) {
                const materiaSnap = await getDoc(conteudo.materia);

                lista.push({
                    id: conteudo.id,
                    area,
                    materia: materiaSnap.exists()
                        ? materiaSnap.data().nome
                        : "Matéria não encontrada",
                    nome: conteudo.nome,
                    status: conteudo.status,
                });
            }

            setListConteudosObj(lista);
        };

        simplificar();
    }, [conteudosLocais]);

    // Atualiza checkbox e sincroniza pai + Firestore
    const setCheckboxStatus = async (conteudoNome, isChecked) => {
        const novoStatus = isChecked ? "iniciado" : "não iniciado";

        console.log(`${conteudoNome}: ${isChecked}`);
        const atualizados = conteudosLocais.map((c) =>
            c.nome === conteudoNome ? { ...c, status: novoStatus } : c
        );

        setConteudosLocais(atualizados);

        try {
            const q = query(collection(db, "conteudos"), where("nome", "==", conteudoNome));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const docRef = doc(db, "conteudos", snap.docs[0].id);
                await updateDoc(docRef, { status: novoStatus });
                console.log(`Status atualizado para '${novoStatus}' no Firestore.`);
            } else {
                console.warn(`Nenhum conteúdo encontrado com nome '${conteudoNome}'`);
            }
        } catch (e) {
            console.error("Erro ao atualizar conteúdo:", e);
        }
    };

    useEffect(() => {
        setLoading(true);

        if (!user) return;

        const fetchData = async () => {
            try {
                // pegar as sessoes do usuario logado
                const querysessaoEstudo = query(
                    collection(db, "sessaoEstudo"),
                    where("user", "==", user.email),
                );
                const querySnapshotSessaoEstudo = await getDocs(querysessaoEstudo);

                const querysessaoEstudoPomodoro = query(
                    collection(db, "sessaoEstudoPomodoro"),
                    where("user", "==", user.email),
                );
                const querySnapshotSessaoEstudoPomodoro = await getDocs(querysessaoEstudoPomodoro);

                // ========================================================================
                // CALCULAR NÚMERO DE QUESTÕES RESOLVIDAS E CORRETAS
                // ========================================================================
                let totalQuestoesResolvidas = 0;
                let totalQuestoesCorretas = 0;

                console.log("🔎 Iniciando cálculo de questões... total de sessões:", querySnapshotSessaoEstudo.size);

                for (const docSessao of querySnapshotSessaoEstudo.docs) {
                    const sessaoId = docSessao.id;
                    const sessaoData = docSessao.data();

                    console.log(`🧩 [Sessão ${sessaoId}] Dados:`, sessaoData);

                    const atividadeRef = sessaoData.atividade;
                    if (!atividadeRef) {
                        console.warn(`⚠️ [Sessão ${sessaoId}] Sem referência de atividade.`);
                        continue;
                    }

                    // Buscar atividade
                    const atividadeSnap = await getDoc(atividadeRef);
                    if (!atividadeSnap.exists()) {
                        console.warn(`⚠️ [Sessão ${sessaoId}] Atividade não encontrada (ref: ${atividadeRef.path}).`);
                        continue;
                    }

                    const atividadeData = atividadeSnap.data();
                    console.log(`📘 [Sessão ${sessaoId}] Atividade encontrada:`, atividadeData);

                    const materiaRef = atividadeData.materia;
                    if (!materiaRef) {
                        console.warn(`⚠️ [Sessão ${sessaoId}] Atividade sem referência de matéria.`);
                        continue;
                    }

                    // Buscar matéria
                    const materiaSnap = await getDoc(materiaRef);
                    if (!materiaSnap.exists()) {
                        console.warn(`⚠️ [Sessão ${sessaoId}] Matéria não encontrada (ref: ${materiaRef.path}).`);
                        continue;
                    }

                    const materiaData = materiaSnap.data();
                    const materiaNome = materiaData?.nome || "(sem nome)";
                    console.log(`📗 [Sessão ${sessaoId}] Matéria: ${materiaNome}`);

                    // Somar apenas se for da área correspondente
                    if (materiaNome === title) {
                        console.log(`✅ [Sessão ${sessaoId}] Contabilizada — corresponde à área "${title}".`);
                        totalQuestoesResolvidas += sessaoData.numQuestoesResolvidas || 0;
                        totalQuestoesCorretas += sessaoData.numQuestoesCorretas || 0;
                    } else {
                        console.log(`↩️ [Sessão ${sessaoId}] Ignorada — matéria "${materiaNome}" ≠ área "${title}".`);
                    }
                }

                console.log("📊 Resultado final:");
                console.log("  → Total de questões resolvidas:", totalQuestoesResolvidas);
                console.log("  → Total de questões corretas:", totalQuestoesCorretas);


                // ========================================================================
                // CALCULAR QUESTÕES DAS SESSÕES POMODORO
                // ========================================================================
                console.log("⏱️ Iniciando cálculo de questões (POMODORO)... total de sessões:", querySnapshotSessaoEstudoPomodoro.size);

                for (const docSessao of querySnapshotSessaoEstudoPomodoro.docs) {
                    const sessaoId = docSessao.id;
                    const sessaoData = docSessao.data();

                    console.log(`🧩 [Pomodoro ${sessaoId}] Dados:`, sessaoData);

                    const atividadeRef = sessaoData.atividade;
                    if (!atividadeRef) {
                        console.warn(`⚠️ [Pomodoro ${sessaoId}] Sem referência de atividade.`);
                        continue;
                    }

                    // Buscar atividade
                    const atividadeSnap = await getDoc(atividadeRef);
                    if (!atividadeSnap.exists()) {
                        console.warn(`⚠️ [Pomodoro ${sessaoId}] Atividade não encontrada (ref: ${atividadeRef.path}).`);
                        continue;
                    }

                    const atividadeData = atividadeSnap.data();
                    console.log(`📘 [Pomodoro ${sessaoId}] Atividade encontrada:`, atividadeData);

                    const materiaRef = atividadeData.materia;
                    if (!materiaRef) {
                        console.warn(`⚠️ [Pomodoro ${sessaoId}] Atividade sem referência de matéria.`);
                        continue;
                    }

                    // Buscar matéria
                    const materiaSnap = await getDoc(materiaRef);
                    if (!materiaSnap.exists()) {
                        console.warn(`⚠️ [Pomodoro ${sessaoId}] Matéria não encontrada (ref: ${materiaRef.path}).`);
                        continue;
                    }

                    const materiaData = materiaSnap.data();
                    const materiaNome = materiaData?.nome || "(sem nome)";
                    console.log(`📗 [Pomodoro ${sessaoId}] Matéria: ${materiaNome}`);

                    // Somar apenas se for da área correspondente
                    if (materiaNome === title) {
                        console.log(`✅ [Pomodoro ${sessaoId}] Contabilizada — corresponde à área "${title}".`);
                        console.log(`   ↳ Resolvidas: ${sessaoData.numQuestoesResolvidas || 0}`);
                        console.log(`   ↳ Corretas: ${sessaoData.numQuestoesCorretas || 0}`);

                        totalQuestoesResolvidas += sessaoData.numQuestoesResolvidas || 0;
                        totalQuestoesCorretas += sessaoData.numQuestoesCorretas || 0;
                    } else {
                        console.log(`↩️ [Pomodoro ${sessaoId}] Ignorada — matéria "${materiaNome}" ≠ área "${title}".`);
                    }
                }

                console.log("📊 Resultado parcial (POMODORO):");
                console.log("  → Total de questões resolvidas:", totalQuestoesResolvidas);
                console.log("  → Total de questões corretas:", totalQuestoesCorretas);


                setNumQuestoesResolvidas(totalQuestoesResolvidas);
                setNumQuestoesCorretas(totalQuestoesCorretas);

                console.log('Num questões resolvidas:', totalQuestoesResolvidas);
                console.log('Num questões corretas:', totalQuestoesCorretas);
                console.log('Porcentagem de acerto:', (totalQuestoesCorretas / totalQuestoesResolvidas).toFixed(2));

                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar conteúdos das matérias:", error);
            }
        };

        fetchData();
    }, [user, conteudosLocais]);

    const abrirModalInfo = (title) => {
        if (!modalVisibleEditarMateria && !modalVisibleEditarConteudo) {
            console.log(`>_Clicou em "${title}"`);
            setModalVisibleDeleteConteudo(false);
            setModalVisibleEditarMateria(false);
            setModalVisibleInfo(true);
        }
    };

    const atualizarMateria = async () => {
        try {
            // localizar a matéria selecionada dentro da lista
            const materia = listMaterias.find(m => m.nome === materiaSelecionada.nome);

            if (!materia) {
                showToast("erro", "Erro", "Matéria não encontrada na lista.");
                return;
            }

            const materiaID = materia.id;
            const nomeMateria = materiaSelecionada.nome;

            if (!materiaID) {
                showToast("erro", "Erro", "ID da matéria inválido.");
                return;
            }

            // atualizar no Firestore
            const materiaRef = doc(db, "materias", materiaID);
            await updateDoc(materiaRef, { nome: nomeMateriaAtualizado });

            console.log(`✅ Matéria ${materiaID} atualizada para: ${nomeMateriaAtualizado}`);

            showToast(
                "sucesso",
                "Matéria atualizada",
                "O nome da matéria foi alterado com sucesso."
            );

            // fechar modal
            setModalVisibleEditarMateria(false);

            // atualizar lista local (CORRETO)
            setListMaterias(prev =>
                prev.map(m =>
                    m.id === materiaID
                        ? { ...m, nome: nomeMateria } // atualiza só ela
                        : m
                )
            );

        } catch (error) {
            console.error("❌ Erro ao atualizar matéria:", error);

            showToast(
                "erro",
                "Erro ao atualizar",
                "Não foi possível atualizar esta matéria."
            );
        }
    };

    const atualizarConteudo = async () => {
        try {
            // localizar o conteúdo selecionado dentro da lista
            const conteudo = conteudos.find(c => c.id === conteudoSelecionado.id);

            if (!conteudo) {
                showToast("erro", "Erro", "Conteúdo não encontrado na lista.");
                return;
            }

            const conteudoID = conteudo.id;

            if (!conteudoID) {
                showToast("erro", "Erro", "ID do conteúdo inválido.");
                return;
            }

            // atualizar no Firestore
            const conteudoRef = doc(db, "conteudos", conteudoID);
            await updateDoc(conteudoRef, { nome: nomeConteudoAtualizado });

            console.log(`✅ Conteúdo ${conteudoID} atualizado para: ${nomeConteudoAtualizado}`);

            showToast(
                "sucesso",
                "Conteúdo atualizado",
                "O nome do conteúdo foi alterado com sucesso."
            );

            // fechar modal
            setModalVisibleEditarConteudo(false);

            // atualizar lista local (CORRETO)
            setConteudos(prev =>
                prev.map(c =>
                    c.id === conteudoID
                        ? { ...c, nome: nomeConteudoAtualizado }
                        : c
                )
            );

        } catch (error) {
            console.error("❌ Erro ao atualizar conteúdo:", error);


            showToast(
                "erro",
                "Erro ao atualizar",
                "Não foi possível atualizar este conteúdo."
            );
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={() => abrirModalInfo(title)}>
            {/* Cabeçalho */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.badge}>
                    <Text>{numConteudosTotal} {numConteudosTotal === 1 ? "conteúdo" : "conteúdos"}</Text>
                </View>
            </View>

            <Text>{numConteudosIniciados} de {numConteudosTotal} iniciados</Text>

            {/* Barra de progresso */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${porcentagemConteudos}%` }]} />
            </View>

            {/* Lista de checkboxes */}
            <View style={{ marginTop: 10, gap: 5 }}>
                {listConteudosObj.map((c, i) => (
                    <View key={`id-fb-${c.nome}-${c.id}`} style={{ flexDirection: "row", justifyContent: 'space-between' }}>
                        <Checkbox
                            label={c.nome}
                            checked={c.status === "iniciado"}
                            onPress={setCheckboxStatus}
                        />
                        <View style={{ flexDirection: "row", gap: 5 }}>
                            <TouchableOpacity onPress={() => abrirModalEditarConteudo(c)}>
                                <MaterialIcons name="edit-square" size={25} color='#d9a60b' />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => abrirModalExcluirConteudo(c)}>
                                <MaterialIcons name="delete" size={25} color='#b21414' />
                            </TouchableOpacity>

                            {/* <TouchableOpacity style={{
                                backgroundColor: '#d9a60b',
                                borderRadius: 10,
                                padding: 4
                            }}>
                                <Text style={{ color: '#000' }}>
                                    Editar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{
                                backgroundColor: '#b21414',
                                borderRadius: 10,
                                padding: 4
                            }}>
                                <Text style={{ color: '#fff' }}>
                                    Excluir
                                </Text>
                            </TouchableOpacity> */}
                        </View>
                    </View>
                ))}
            </View>

            {/* Modal info */}
            <Modal
                presentationStyle="overFullScreen"
                visible={modalVisibleInfo}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisibleInfo(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* botao fechar */}
                        <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleInfo(false)}>
                            <MaterialIcons name="close" size={24} color="#34445B" />
                        </TouchableOpacity>

                        {/* lista conteudos-status */}
                        <Text style={styles.modalTitle}>{title}</Text>
                        {listConteudosObj.map((c, i) => (
                            <View
                                style={styles.itemListModal}
                                key={`id__fb-${c.nome}-${i}`}>
                                <Text>{c.nome}</Text>
                                <Text
                                    style={[
                                        styles.statusContent,
                                        {
                                            backgroundColor:
                                                c.status === "concluído"
                                                    ? "#22C55E"
                                                    : c.status === "iniciado"
                                                        ? "#3B82F6"
                                                        : "#ccc",
                                        },
                                    ]}
                                >
                                    {c.status}
                                </Text>
                            </View>
                        ))}

                        {/* estatistica */}
                        <View style={{ marginTop: 20 }}>
                            <Text>Estatística</Text>
                            <View style={styles.containerInfo}>
                                {/* item */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>Questões resolvidas:</Text>
                                    {
                                        loading ?
                                            <Image
                                                source={require('../../../assets/loading.gif')}
                                                style={{ width: 15, height: 15, alignSelf: 'center' }}
                                            /> :
                                            <Text style={{ color: '#34445B', fontWeight: 'bold' }}>{Number(numQuestoesResolvidas)}</Text>
                                    }
                                </View>

                                {/* item */}
                                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>Tempo total de estudos:</Text>
                                    <Text style={{ color: '#34445B', fontWeight: 'bold' }}>02:30h</Text>
                                </View> */}

                                {/* item */}
                                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>Última sessão de estudos:</Text>
                                    <Text style={{ color: '#34445B', fontWeight: 'bold' }}>15/02/2025</Text>
                                </View> */}

                                {/* item */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>Taxa de acerto:</Text>
                                    {
                                        loading ?
                                            <Image
                                                source={require('../../../assets/loading.gif')}
                                                style={{ width: 15, height: 15, alignSelf: 'center' }}
                                            /> :
                                            <Text style={{ color: '#34445B', fontWeight: 'bold' }}>
                                                {
                                                    isNaN(numQuestoesCorretas / numQuestoesResolvidas)
                                                        ? "0%"
                                                        : `${((numQuestoesCorretas / numQuestoesResolvidas) * 100).toFixed(2)}%`
                                                }
                                            </Text>
                                    }
                                </View>
                            </View>

                            {/* botoes de acao */}
                            <View style={{ marginTop: 20, gap: 10 }}>
                                {/* btn editar */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.buttonDelete, { backgroundColor: '#d9a60b' }]}
                                    onPress={() => abrirModalEditarMateria(title)}>
                                    <Text style={{ color: "#000", fontWeight: 'bold', textAlign: 'center' }}>
                                        Editar matéria
                                    </Text>
                                </TouchableOpacity>

                                {/* btn excluir */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.buttonDelete}
                                    onPress={() => abrirModalDeleteMateria(title)}>
                                    <Text style={{ color: "#fff", fontWeight: 'bold', textAlign: 'center' }}>
                                        Excluir matéria
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* proximos estudos */}
                        {/* <View style={{ marginTop: 20 }}>
                            <Text>Próximos estudos</Text>
                            <View style={styles.containerInfo}>
                                <Text>Amanhã | 10:30 - 12:00</Text>
                                <Text>Sexta | 13:30 - 14:30</Text>
                            </View>
                        </View> */}

                        {/* <View style={{ marginTop: 20 }}>
                            <TouchableOpacity activeOpacity={0.8} style={styles.buttonDelete} onPress={abrirModalExcluirConteudo}>
                                <Text style={{ color: "#fff", fontWeight: 'bold', textAlign: 'center' }}>Excluir</Text>
                            </TouchableOpacity>
                        </View> */}
                    </View>
                </View>
            </Modal>

            {/* modal editar materia */}
            <Modal
                presentationStyle="overFullScreen"
                visible={modalVisibleEditarMateria}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisibleEditarMateria(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* botao fechar */}
                        <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleEditarMateria(false)}>
                            <MaterialIcons name="close" size={24} color="#34445B" />
                        </TouchableOpacity>''

                        <Text style={styles.modalTitle}>Atualizar matéria</Text>

                        <InputField
                            label="Nome da matéria"
                            placeholder="Novo nome da matéria"
                            value={nomeMateriaAtualizado}
                            onChangeText={setNomeMateriaAtualizado}
                        />

                        {/* button atualizar materia */}
                        <View style={{ marginTop: 10 }}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#34445B' }]}
                                onPress={atualizarMateria}
                            >
                                <Text style={{ color: "#fff" }}>Atualizar</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

            {/* modal editar conteudo */}
            <Modal
                presentationStyle="overFullScreen"
                visible={modalVisibleEditarConteudo}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisibleEditarConteudo(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* botao fechar */}
                        <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleEditarConteudo(false)}>
                            <MaterialIcons name="close" size={24} color="#34445B" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Atualizar conteúdo</Text>

                        <InputField
                            label="Nome da conteúdo"
                            placeholder="Novo nome da conteúdo"
                            value={nomeConteudoAtualizado}
                            onChangeText={setNomeConteudoAtualizado}
                        />

                        {/* button atualizar materia */}
                        <View style={{ marginTop: 10 }}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#34445B' }]}
                            onPress={atualizarConteudo}
                            >
                                <Text style={{ color: "#fff" }}>Atualizar</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

            {/* modal delete conteudo */}
            <Modal
                visible={modalVisibleDeleteConteudo}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisibleDeleteConteudo(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { width: '70%' }]}>
                        <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleDeleteConteudo(false)}>
                            <MaterialIcons name="close" size={24} color="#34445B" />
                        </TouchableOpacity>

                        <View>
                            <Text style={styles.modalTitle}>Excluir conteudo</Text>
                            <Text style={{ textAlign: 'center' }}>Tem certeza que deseja excluir o conteúdo
                                <Text style={{ marginStart: 3, color: '#34445B', fontWeight: 'bold' }}>
                                    {conteudoSelecionado?.nome}
                                </Text>
                                ??</Text>

                            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: 'space-between' }}>
                                <TouchableOpacity style={styles.button} onPress={() => setModalVisibleDeleteConteudo(false)}>
                                    <Text style={{ color: "#fff" }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: '#ae3a3a' }]} onPress={async () => {
                                        await excluirConteudo(conteudoSelecionado.id);
                                        setModalVisibleDeleteConteudo(false);                                    }}
                                >
                                    {/* excluirConteudo */}
                                    <Text style={{ color: "#fff" }}>Excluir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* modal delete materia */}
            <Modal
                visible={modalVisibleDeleteMateria}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisibleDeleteMateria(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { width: '70%' }]}>
                        <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleDeleteMateria(false)}>
                            <MaterialIcons name="close" size={24} color="#34445B" />
                        </TouchableOpacity>

                        <View>
                            <Text style={styles.modalTitle}>Excluir matéria</Text>
                            <Text style={{ textAlign: 'center' }}>Tem certeza que deseja excluir a matéria
                                <Text style={{ marginStart: 3, color: '#34445B', fontWeight: 'bold' }}>
                                    {materiaSelecionada?.nome}
                                </Text>
                                ??</Text>

                            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: 'space-between' }}>
                                <TouchableOpacity style={styles.button} onPress={() => setModalVisibleDeleteMateria(false)}>
                                    <Text style={{ color: "#fff" }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: '#ae3a3a' }]} onPress={async () => {
                                        await excluirMateria(materiaSelecionada?.id);
                                        setModalVisibleDeleteMateria(false);
                                        // atualizarMaterias();
                                    }}
                                >
                                    {/* excluirConteudo */}
                                    <Text style={{ color: "#fff" }}>Excluir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: "#34445B",
        padding: 10,
        borderRadius: 10,
    },
    title: {
        color: "#34445B",
        fontWeight: "bold",
        fontSize: 20,
    },
    badge: {
        borderWidth: 1,
        borderColor: "#34445B",
        padding: 4,
        borderRadius: 8,
    },
    progressBar: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#34445B",
        borderRadius: 10,
        height: 15,
    },
    progressFill: {
        backgroundColor: "#34445B",
        height: "100%",
        borderRadius: 10,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "lightblue",
        borderWidth: 2,
        borderColor: "#34445B",
        borderRadius: 10,
        width: "90%",
        padding: 20,
    },
    btnClose: {
        position: "absolute",
        top: 10,
        right: 10,
    },
    modalTitle: {
        color: "#34445B",
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 10,
    },
    itemListModal: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#34445B",
        padding: 5,
        borderRadius: 5,
        marginTop: 5,
    },
    statusContent: {
        borderWidth: 1,
        borderColor: "#34445B",
        padding: 3,
        borderRadius: 5,
    },
    containerInfo: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#34445B',
        padding: 10,
        borderRadius: 10,
    },
    button: {
        backgroundColor: "#595959",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDelete: {
        backgroundColor: '#ad1a1a',
        padding: 10,
        borderRadius: 10,
    }
});
