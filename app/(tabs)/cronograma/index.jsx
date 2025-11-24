import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from "../../../firebaseConf";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import InputField from '../../components/forms/InputField';
import SelectField from '../../components/forms/SelectField';
import Checkbox from '../../components/forms/Checkbox';
import { CustomToast, showToast } from '../../components/CustomToast';

export default function Cronograma() {
    const router = useRouter();
    const auth = getAuth();

    const [user, setUser] = useState(auth.currentUser);
    const [diaSelecionado, setDiaSelecionado] = useState('Sábado');

    const diasDaSemana = [
        "Domingo", "Segunda-Feira", "Terça-Feira",
        "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];

    // const [loading, setLoading] = useState(true);

    const [materiaSelecionada, setMateriaSelecionada] = useState(null);
    const [inputField, setInputField] = useState('');

    // sem pomodoro
    const [horarioInicio, setHorarioInicio] = useState(''); // pomodoro tbm
    const [horarioTermino, setHorarioTermino] = useState('');

    //com pomodoro
    const [numCiclos, setNumCiclos] = useState(null);
    const [tempoPausa, setTempoPausa] = useState(null);
    const [tempoEstudo, setTempoEstudo] = useState(null);

    const [datasetAreas, setDatasetAreas] = useState([]);
    const [datasetMaterias, setDatasetMaterias] = useState([]);
    const [datasetConteudos, setDatasetConteudos] = useState([]);
    const [diaSemanaSelecionado, setDiaSemanaSelecionado] = useState('');

    const [listAtividades, setListAtividades] = useState([]);
    // const [listSessoes, setListSessoes] = useState([]);
    const [dadosOrganizados, setDadosOrganizados] = useState({}); // <- novo estado para o objeto final
    const [mapAreaMaterias, setMapAreaMaterias] = useState({});

    // atividade selecionada
    const [atividadeSelecionada, setAtividadeSelecionada] = useState(null);

    //controlar os times/sessoes do form
    const [sessaoFormEhPomodoro, setSessaoFormEhPomodoro] = useState(false);

    // modals
    const [modalVisibleAdicionar, setModalVisibleAdicionar] = useState(false);
    const [modalVisibleExcluir, setModalVisibleExcluir] = useState(false);
    const [modalVisibleEditar, setModalVisibleEditar] = useState(false);

    // dados edicao atividade
    const [atvEditId, setAtvEditId] = useState(null);
    const [atvEditMateria, setAtvEditMateria] = useState(null);
    const [atvEditConteudo, setAtvEditConteudo] = useState(null);
    const [atvEditDiaDaSemana, setAtvEditDiaDaSemana] = useState('');
    const [atvEditHorarioInicio, setAtvEditHorarioInicio] = useState('');
    const [atvEditHorarioTermino, setAtvEditHorarioTermino] = useState('');
    const [atvEditSessaoEhPomodoro, setAtvEditSessaoEhPomodoro] = useState(false);
    const [atvEditNumCiclos, setAtvEditNumCiclos] = useState(null);
    const [atvEditTempoPausa, setAtvEditTempoPausa] = useState(null);
    const [atvEditTempoEstudo, setAtvEditTempoEstudo] = useState(null);

    // Controle de autenticação
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (!u) router.replace("/");
            else setUser(u);
        });

        return () => unsubscribe();
    }, []);

    // definir dia da semana atual ao carregar a tela
    useEffect(() => {
        const hoje = new Date();
        const diaAtual = diasDaSemana[hoje.getDay()];
        console.log('Dia atual:', diaAtual);
        setDiaSelecionado(diaAtual);
    }, []);

    // Buscar Áreas
    useEffect(() => {
        if (!user) return;

        const fetchAreas = async () => {
            console.log('[USER]:', user.email);

            try {
                const qSnapshot = await getDocs(
                    query(
                        collection(db, "areas"),
                        where("user", "==", user.email)
                    )
                );

                console.log('qSnapshot: ', qSnapshot);

                const listaAreas = qSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ref: doc.ref,
                    ...doc.data(),
                }));

                setDatasetAreas(listaAreas);

                console.log("Áreas carregadas:", listaAreas);
            } catch (err) {
                console.error("Erro ao buscar as áreas:", err);
            }
        };

        fetchAreas();
    }, [user]);

    // Buscar e organizar as matérias (dependente das áreas)
    useEffect(() => {
        if (!datasetAreas || datasetAreas.length === 0) return;

        const fetchMateriasPorArea = async () => {
            console.log("=== [fetchMateriasPorArea] Iniciando busca... ===");

            try {
                const mapa = {};
                const todasMaterias = [];

                // Promise.all para buscar matérias de cada área
                await Promise.all(
                    datasetAreas.map(async (area, index) => {
                        const areaNome = area.nome || "(sem nome)";
                        const areaRef = area.ref;

                        console.log(`   [${index + 1}/${datasetAreas.length}] Área:`, areaNome);

                        const materiasQuery = query(
                            collection(db, "materias"),
                            where("area", "==", areaRef)
                        );

                        const materiasSnapshot = await getDocs(materiasQuery);
                        console.log(`   ✔ Encontradas ${materiasSnapshot.size} matérias em '${areaNome}'.`);

                        const materiasLista = materiasSnapshot.docs.map((m) => ({
                            id: m.id,
                            ...m.data(),
                        }));

                        mapa[areaNome] = materiasLista;
                        todasMaterias.push(...materiasLista);
                    })
                );

                console.log("✔ Promise.all finalizada.");
                console.log("🗺️ Mapa final de áreas → matérias:", mapa);
                console.log("📚 Total de matérias encontradas:", todasMaterias.length);

                setMapAreaMaterias(mapa);
                setDatasetMaterias(todasMaterias);
            } catch (err) {
                console.error("❌ Erro ao buscar matérias por área:", err);
            } finally {
                console.log("=== [fetchMateriasPorArea] Finalizado ===");
                // setLoading(false);
            }
        };

        fetchMateriasPorArea();
    }, [datasetAreas]);

    // buscar conteudos por materia
    useEffect(() => {
        if (!user || !datasetAreas || datasetAreas.length === 0 || !materiaSelecionada) return;

        const buscarConteudos = async () => {
            console.log("=== [buscarConteudos] Iniciando busca ===");
            if (!materiaSelecionada) {
                console.log("⚠ Nenhuma matéria selecionada. Abortando busca.");
                setDatasetConteudos([]);
                return;
            }

            try {
                console.log(`→ Buscando referência da matéria: ${materiaSelecionada}`);
                const materiaQuery = query(
                    collection(db, "materias"),
                    where("nome", "==", materiaSelecionada)
                );

                const materiaSnapshot = await getDocs(materiaQuery);

                if (materiaSnapshot.empty) {
                    console.warn(`⚠ Matéria '${materiaSelecionada}' não encontrada no Firestore.`);
                    setDatasetConteudos([]);
                    return;
                }

                const materiaRef = materiaSnapshot.docs[0].ref;
                console.log("✔ Matéria encontrada:", materiaRef.id);

                console.log(`→ Buscando conteúdos da matéria '${materiaSelecionada}'...`);
                const conteudoQuery = query(
                    collection(db, "conteudos"),
                    where("materia", "==", materiaRef)
                );

                const conteudoSnapshot = await getDocs(conteudoQuery);
                console.log("✔ Total de conteúdos encontrados:", conteudoSnapshot.size);

                const listaConteudos = conteudoSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setDatasetConteudos(listaConteudos);
                console.log("🗂️ Conteúdos carregados:", listaConteudos);
            } catch (err) {
                console.error("❌ Erro ao buscar os conteúdos:", err);
            } finally {
                console.log("=== [buscarConteudos] Finalizado ===");
            }
        };

        buscarConteudos();
    }, [user, datasetAreas, materiaSelecionada]);

    // Buscar atividades
    useEffect(() => {
        if (!user || !datasetAreas || datasetAreas.length === 0) return;

        const buscarAtividades = async () => {
            try {
                // buscar todas as atividades na coleção "atividade"
                const q = query(
                    collection(db, "atividade"),
                    // orderBy("tempoInicio", "asc") // ordena pelo horário de início
                );
                const snap = await getDocs(q);

                const atividades = await Promise.all(
                    snap.docs.map(async (docSnap) => {
                        const atividadeRef = docSnap.ref;
                        const dados = docSnap.data();
                        const id = docSnap.id;
                        const conteudoRef = dados.conteudo;
                        const tempoInicio = dados.horarioInicio || null;
                        const tempoFim = dados.horarioTermino || null;
                        const diaDaSemana = dados.diaDaSemana || null;

                        let nome = "Sem conteúdo";
                        let materia = "Sem matéria";

                        if (conteudoRef) {
                            const conteudoSnap = await getDoc(conteudoRef);
                            const conteudoDados = conteudoSnap.data();

                            if (conteudoDados) {
                                nome = conteudoDados.nome || "Sem conteúdo";

                                if (conteudoDados.materia) {
                                    const materiaSnap = await getDoc(conteudoDados.materia);
                                    materia = materiaSnap.data()?.nome || "Sem matéria";
                                }
                            }
                        }
                        console.log('dados.conteudo: ', dados.conteudo)

                        return {
                            atividadeRef,
                            id,
                            nome,
                            conteudoRef,
                            materia,
                            tempoInicio,
                            tempoFim,
                            diaDaSemana,
                            tipoSessao: dados.tipoSessao,
                            tempoEstudo: Number(dados.tempoEstudo) || 25,
                            tempoPausa: Number(dados.tempoPausa) || 5,
                            numCiclos: Number(dados.numCiclos) || 1,
                        };
                    })
                );

                setListAtividades(atividades);
                console.log("Atividades carregadas:", atividades);
            } catch (error) {
                console.error("Erro ao buscar atividades:", error);
            }
        };

        buscarAtividades();
    }, [user, datasetAreas]);

    // Organizar atividades em um único objeto por dia
    useEffect(() => {
        if (!user || !datasetAreas || datasetAreas.length === 0 || !listAtividades || listAtividades.length == 0) return;

        const organizarAtividadesPorDia = () => {
            const objeto = {};

            listAtividades.forEach(item => {
                // pega o dia da semana diretamente do item
                const dia = item.diaDaSemana;

                // define a chave por extenso
                const chave = dia
                    ? dia.charAt(0).toUpperCase() + dia.slice(1)
                    : "Outros"; // fallback caso não tenha diaDaSemana

                if (!objeto[chave]) objeto[chave] = [];
                objeto[chave].push(item);
            });

            setDadosOrganizados(objeto);
        };

        if (listAtividades.length) {
            organizarAtividadesPorDia();
        }

        if (listAtividades.length) console.log("listAtividades:", listAtividades);
    }, [user, datasetAreas, listAtividades]);

    // Funções auxiliares
    const alterarDia = (dia) => {
        console.log(dia);
        setDiaSelecionado(dia);
    };

    const filterHorario = (value) => {
        if (!value) return "";

        // remove tudo que não é número
        let digits = value.replace(/\D/g, "").slice(0, 4);

        // se o usuário ainda não digitou nada
        if (digits.length === 0) return "";

        // processa as horas e minutos conforme digita
        let horas = digits.slice(0, 2);
        let minutos = digits.slice(2, 4);

        // se já há 2 dígitos de hora, ajusta para o intervalo 00–23
        if (horas.length === 2) {
            const h = Math.min(parseInt(horas, 10), 23);
            horas = String(h).padStart(2, "0");
        }

        // se já há 2 dígitos de minuto, ajusta para o intervalo 00–59
        if (minutos.length === 2) {
            const m = Math.min(parseInt(minutos, 10), 59);
            minutos = String(m).padStart(2, "0");
        }

        // monta a string progressivamente
        if (digits.length <= 2) return horas;
        return `${horas}:${minutos}`;
    };

    // salvar atividade
    const salvarAtividade = async () => {
        console.log('Materia: ', materiaSelecionada);
        console.log('Conteudo: ', inputField);
        console.log('dia: ', diaSemanaSelecionado);

        if (!materiaSelecionada || !inputField || !diaSemanaSelecionado) {
            console.warn("Preencha todos os campos obrigatórios!");
            return;
        }

        // buscar materiaRef
        const qMateria = query(
            collection(db, "materias"),
            where("nome", "==", materiaSelecionada)
        );

        const materiaSnap = await getDocs(qMateria);
        const materiaRef = !materiaSnap.empty ? materiaSnap.docs[0].ref : null;

        // buscar areaRef
        const materiaData = materiaSnap.docs[0]?.data();
        const areaRef = materiaData?.area;

        // buscar conteudoRef
        const qConteudo = query(
            collection(db, "conteudos"),
            where("nome", "==", inputField)
        );

        const conteudoSnap = await getDocs(qConteudo);
        const conteudoRef = !conteudoSnap.empty ? conteudoSnap.docs[0].ref : null;


        if (!sessaoFormEhPomodoro) {
            console.log('horarioInicio: ',);
            console.log('horarioTermino: ',);

            if (!horarioInicio || !horarioTermino) {
                console.warn("Preencha os campos obrigatórios de horários!");
                return;
            }

            // salvando...
            try {
                const novoAtividade = {
                    area: areaRef,
                    materia: materiaRef,
                    conteudo: conteudoRef,
                    diaDaSemana: diaSemanaSelecionado,
                    horarioInicio,
                    horarioTermino,
                    tipoSessao: "normal",
                    user: user.email
                };

                const docRef = await addDoc(collection(db, "atividade"), novoAtividade);

                console.log("Atividade salvo com sucesso! ID:", docRef.id);
                setModalVisibleAdicionar(false);
                showToast("sucesso", "Atividade criada!", "A atividade foi cadastrada no sistema!")
            } catch (error) {
                showToast("erro", "Erro ao cadastrar atividade!", "Não foi possível cadastrar a atividade no sistema!")
                console.error("Erro ao salvar atividade:", error);
            }

        } else {
            console.log('horarioInicio: ', horarioInicio);
            console.log('numCiclos: ', numCiclos);
            console.log('tempoEstudo: ', tempoEstudo);
            console.log('tempoPausa: ', tempoPausa);

            if (!horarioInicio || !numCiclos || !tempoEstudo || !tempoPausa) {
                console.warn("Preencha todos os campos obrigatórios do ciclo pomodoro!");
                return;
            }

            // salvando...
            try {
                const novoAtividade = {
                    area: areaRef,
                    materia: materiaRef,
                    conteudo: conteudoRef,
                    diaDaSemana: diaSemanaSelecionado,
                    numCiclos: Number(numCiclos),
                    horarioInicio,
                    tempoEstudo: Number(tempoEstudo),
                    tempoPausa: Number(tempoPausa),
                    tipoSessao: "pomodoro",
                    user: user.email
                };

                const docRef = await addDoc(collection(db, "atividade"), novoAtividade);

                console.log("AtividadePOMO salvo com sucesso! ID:", docRef.id);
                setModalVisibleAdicionar(false);
            } catch (error) {
                console.error("Erro ao salvar atividade:", error);
            }
        }
    }

    // atualizar atividade
    const atualizarAtividade = async () => {
        console.log('Materia: ', atvEditMateria);
        console.log('Conteudo: ', atvEditConteudo);
        console.log('Dia: ', atvEditDiaDaSemana);

        if (!atvEditMateria || !atvEditConteudo || !atvEditDiaDaSemana) {
            console.warn("Preencha todos os campos obrigatórios!");
            return;
        }

        if (!atvEditId) {
            console.warn("Nenhuma atividade selecionada para edição!");
            return;
        }

        // ref do doc que será atualizado
        const atividadeRef = doc(db, "atividade", atvEditId);

        // buscar materiaRef
        const qMateria = query(
            collection(db, "materias"),
            where("nome", "==", atvEditMateria)
        );

        const materiaSnap = await getDocs(qMateria);
        const materiaRef = !materiaSnap.empty ? materiaSnap.docs[0].ref : null;

        // buscar areaRef
        const materiaData = materiaSnap.docs[0]?.data();
        const areaRef = materiaData?.area;

        // buscar conteudoRef
        const qConteudo = query(
            collection(db, "conteudos"),
            where("nome", "==", atvEditConteudo)
        );

        const conteudoSnap = await getDocs(qConteudo);
        const conteudoRef = !conteudoSnap.empty ? conteudoSnap.docs[0].ref : null;

        // montar objeto para atualizar
        let dadosAtualizados = {
            area: areaRef,
            materia: materiaRef,
            conteudo: conteudoRef,
            diaDaSemana: atvEditDiaDaSemana,
            user: user.email
        };

        // sessão normal
        if (!atvEditSessaoEhPomodoro) {
            if (!atvEditHorarioInicio || !atvEditHorarioTermino) {
                console.warn("Preencha os campos obrigatórios de horários!");
                return;
            }

            dadosAtualizados = {
                ...dadosAtualizados,
                horarioInicio: atvEditHorarioInicio,
                horarioTermino: atvEditHorarioTermino,
                tipoSessao: "normal",
            };
        }

        // sessao pomodoro
        else {
            if (!atvEditHorarioInicio || !atvEditNumCiclos || !atvEditTempoEstudo || !atvEditTempoPausa) {
                console.warn("Preencha todos os campos obrigatórios do ciclo pomodoro!");
                return;
            }

            dadosAtualizados = {
                ...dadosAtualizados,
                tipoSessao: "pomodoro",
                horarioInicio: atvEditHorarioInicio,
                numCiclos: Number(atvEditNumCiclos),
                tempoEstudo: Number(atvEditTempoEstudo),
                tempoPausa: Number(atvEditTempoPausa),
                horarioTermino: null
            };
        }

        try {
            await updateDoc(atividadeRef, dadosAtualizados);

            console.log("Atividade atualizada com sucesso!");
            setModalVisibleEditar(false);

            showToast("sucesso", "Atividade atualizada!", "As alterações foram salvas.");
        } catch (error) {
            console.error("Erro ao atualizar atividade:", error);
            showToast("erro", "Erro ao atualizar!", "Não foi possível salvar as alterações.");
        }
    };

    // ir para armazenar sessoes da atividade
    const abrirSessao = (atividadeObj) => {
        console.log('obj atividade:', atividadeObj);

        router.push({
            pathname: `/cronograma/sessoesAtv/${atividadeObj.id}`,
            params: {
                atividadePath: atividadeObj.atividadeRef.path,
                conteudoPath: atividadeObj.conteudoRef?.path || null,
                atividadeJson: JSON.stringify(atividadeObj)
            }
        });
    };

    // abrir modal editar atividade
    const abrirModalEditarAtividade = (atvObj) => {
        setAtividadeSelecionada(atvObj);

        setAtvEditId(atvObj.id);
        setAtvEditMateria(atvObj.materia);
        setAtvEditConteudo(atvObj.nome);
        setAtvEditDiaDaSemana(atvObj.diaDaSemana);
        setAtvEditHorarioInicio(atvObj.tempoInicio);
        setAtvEditHorarioTermino(atvObj.tempoFim);
        setAtvEditNumCiclos(atvObj.numCiclos);
        setAtvEditTempoPausa(atvObj.tempoPausa);
        setAtvEditTempoEstudo(atvObj.tempoEstudo);
        setAtvEditSessaoEhPomodoro(atvObj.tipoSessao === "pomodoro");

        setModalVisibleEditar(true);

        console.log('atvObj: ', atvObj);
    }

    // abrir modal excluir atividade
    const abrirModalExcluirAtividade = (atvObj) => {
        setAtividadeSelecionada(atvObj);
        setModalVisibleExcluir(true);
    }

    // excluir atividade
    const excluirAtividade = async (atvID) => {
        try {
            const atvRef = doc(db, "atividade", atvID);
            await deleteDoc(atvRef);
            console.log(`✅ Atividade ${atvID} excluída com sucesso!`);
            showToast("sucesso", "Atividade excluída", "A atividade foi removida corretamente.");
        } catch (error) {
            showToast("erro", "Erro ao excluir", "Não foi possível excluir a atividade.");
            console.error("❌ Erro ao excluir atividade:", error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView>
                <View style={styles.container}>
                    <Text style={styles.title}>Cronograma Semanal</Text>

                    <TouchableOpacity style={styles.button} onPress={() => setModalVisibleAdicionar(true)}>
                        <View style={{ flexDirection: "row", alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="add" size={20} color="#fff" />
                            <Text style={{ color: "#fff" }}>Adicionar atividade</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Dias da semana */}
                    <View style={styles.containerDias}>
                        {diasDaSemana.map((dia, i) => (
                            <TouchableOpacity
                                key={i}
                                style={dia === diaSelecionado ? styles.diaSelecionado : styles.diaNaoSelecionado}
                                onPress={() => alterarDia(dia)}
                            >
                                <Text style={{ color: dia === diaSelecionado ? 'lightblue' : '#34445B' }}>{dia.substring(0, 3)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Conteúdo do dia */}
                    <View>
                        <Text style={{ color: '#34445B', fontWeight: 'bold', fontSize: 20 }}>
                            {diaSelecionado}
                        </Text>
                        <Text>
                            {(dadosOrganizados[diaSelecionado]?.length || 0)} atividades programadas
                        </Text>
                    </View>

                    {/* modal add atividade  */}
                    <Modal
                        visible={modalVisibleAdicionar}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisibleAdicionar(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Adicionar atividade</Text>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleAdicionar(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                <View>
                                    <Text>Adicione uma nova atividade ao seu cronograma</Text>
                                </View>

                                <View style={{ marginTop: 20, gap: 10 }}>
                                    <SelectField
                                        label="Matéria"
                                        placeholder="Selecione uma matéria"
                                        options={datasetMaterias.map(materia => materia.nome)}
                                        selected={materiaSelecionada}
                                        onSelect={setMateriaSelecionada}
                                    />
                                    <SelectField
                                        label="Conteúdo"
                                        placeholder="Selecione um conteúdo"
                                        options={datasetConteudos.map(materia => materia.nome)}
                                        selected={inputField}
                                        onSelect={setInputField}
                                    />
                                    <SelectField
                                        label="Dia da semana"
                                        placeholder="Selecione um dia da semana"
                                        options={diasDaSemana}
                                        selected={diaSemanaSelecionado}
                                        onSelect={setDiaSemanaSelecionado}
                                    />
                                </View>

                                {/* Sessão tipo */}
                                <View style={{ marginTop: 10 }}>
                                    <Checkbox
                                        label='Pomodoro'
                                        checked={sessaoFormEhPomodoro}
                                        onPress={(lbl, sts) => setSessaoFormEhPomodoro(sts)}
                                    />
                                </View>

                                {/* Sessão normal */}
                                {!sessaoFormEhPomodoro && (
                                    <View style={styles.row}>
                                        <InputField
                                            label='Horário Início'
                                            placeholder='Horário Início'
                                            value={horarioInicio}
                                            onChangeText={(value) => setHorarioInicio(filterHorario(value))}
                                        />
                                        <InputField
                                            label='Horário Término'
                                            placeholder='Horário Término'
                                            value={horarioTermino}
                                            onChangeText={(value) => setHorarioTermino(filterHorario(value))}
                                        />
                                    </View>
                                )}

                                {/* Sessão Pomodoro */}
                                {sessaoFormEhPomodoro && (
                                    <View style={{ gap: 0 }}>

                                        <View style={styles.row}>
                                            <InputField
                                                label='Quant. de ciclos'
                                                placeholder='Quant. de ciclos'
                                                value={numCiclos}
                                                onChangeText={setNumCiclos}
                                            />
                                            <InputField
                                                label='Horário Início'
                                                placeholder='Horário Início'
                                                value={horarioInicio}
                                                onChangeText={(value) => setHorarioInicio(filterHorario(value))}
                                            />
                                        </View>

                                        <View style={styles.row}>
                                            <InputField
                                                label='Tempo de pausa'
                                                placeholder='Tempo de pausa'
                                                value={tempoPausa}
                                                onChangeText={setTempoPausa}
                                            />
                                            <InputField
                                                label='Tempo de estudo'
                                                placeholder='Tempo de estudo'
                                                value={tempoEstudo}
                                                onChangeText={setTempoEstudo}
                                            />
                                        </View>

                                    </View>
                                )}

                                {/* botao salvar */}
                                <View style={{ marginTop: 10 }}>
                                    <TouchableOpacity style={styles.button} onPress={salvarAtividade}>
                                        <Text style={{ color: "#fff" }}>Salvar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* modal editar atividade */}
                    <Modal
                        visible={modalVisibleEditar}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisibleEditar(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Atualizar atividade</Text>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleEditar(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                <View style={{ marginTop: 20, gap: 10 }}>
                                    <SelectField
                                        label="Matéria"
                                        placeholder="Selecione uma matéria"
                                        options={datasetMaterias.map(materia => materia.nome)}
                                        selected={atvEditMateria}
                                        onSelect={setAtvEditMateria}
                                    />
                                    <SelectField
                                        label="Conteúdo"
                                        placeholder="Selecione um conteúdo"
                                        options={datasetConteudos.map(materia => materia.nome)}
                                        selected={atvEditConteudo}
                                        onSelect={setAtvEditConteudo}
                                    />
                                    <SelectField
                                        label="Dia da semana"
                                        placeholder="Selecione um dia da semana"
                                        options={diasDaSemana}
                                        selected={atvEditDiaDaSemana}
                                        onSelect={setAtvEditDiaDaSemana}
                                    />
                                </View>

                                {/* Sessão tipo */}
                                <View style={{ marginTop: 10 }}>
                                    <Checkbox
                                        label='Pomodoro'
                                        checked={atvEditSessaoEhPomodoro}
                                        onPress={(lbl, sts) => setAtvEditSessaoEhPomodoro(sts)}
                                    />
                                </View>

                                {/* Sessão normal */}
                                {!atvEditSessaoEhPomodoro && (
                                    <View style={styles.row}>
                                        <InputField
                                            label='Horário Início'
                                            placeholder='Horário Início'
                                            value={atvEditHorarioInicio}
                                            onChangeText={(value) => setAtvEditHorarioInicio(filterHorario(value))}
                                        />
                                        <InputField
                                            label='Horário Término'
                                            placeholder='Horário Término'
                                            value={atvEditHorarioTermino}
                                            onChangeText={(value) => setAtvEditHorarioTermino(filterHorario(value))}
                                        />
                                    </View>
                                )}

                                {/* Sessão Pomodoro */}
                                {atvEditSessaoEhPomodoro && (
                                    <View style={{ gap: 0 }}>

                                        <View style={styles.row}>
                                            <InputField
                                                label='Quant. de ciclos'
                                                placeholder='Quant. de ciclos'
                                                value={atvEditNumCiclos}
                                                onChangeText={setAtvEditNumCiclos}
                                            />
                                            <InputField
                                                label='Horário Início'
                                                placeholder='Horário Início'
                                                value={atvEditHorarioInicio}
                                                onChangeText={(value) => setAtvEditHorarioInicio(filterHorario(value))}
                                            />
                                        </View>

                                        <View style={styles.row}>
                                            <InputField
                                                label='Tempo de pausa'
                                                placeholder='Tempo de pausa'
                                                value={atvEditTempoPausa}
                                                onChangeText={setAtvEditTempoPausa}
                                            />
                                            <InputField
                                                label='Tempo de estudo'
                                                placeholder='Tempo de estudo'
                                                value={atvEditTempoEstudo}
                                                onChangeText={setAtvEditTempoEstudo}
                                            />
                                        </View>

                                    </View>
                                )}

                                {/* botao atualizar */}
                                <View style={{ marginTop: 10 }}>
                                    <TouchableOpacity style={styles.button}
                                        onPress={atualizarAtividade}
                                    >
                                        <Text style={{ color: "#fff" }}>Atualizar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* modal excluir */}
                    <Modal
                        visible={modalVisibleExcluir}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setModalVisibleExcluir(false)}
                    >
                        <View style={styles.modalBackdrop}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Excluir atividade</Text>

                                {/* Botão de fechar */}
                                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisibleExcluir(false)}>
                                    <MaterialIcons name="close" size={24} color="#34445B" />
                                </TouchableOpacity>

                                <View>
                                    <Text
                                        style={{ textAlign: 'center' }}
                                    >
                                        Tem certeza que deseja excluir a atividade sobre <Text
                                            style={{ fontWeight: 'bold', color: '#34445B' }}
                                        >
                                            {atividadeSelecionada?.nome}
                                        </Text>?
                                    </Text>
                                </View>

                                <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={
                                            [styles.button, {
                                                flex: 1,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }]}
                                        onPress={() => setModalVisibleExcluir(false)}>
                                        <View style={{ flexDirection: "row", alignItems: 'center' }}>
                                            <MaterialIcons name="close" size={20} color="#fff" />
                                            <Text style={{ color: "#fff" }}>Cancelar</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={
                                            [styles.button, {
                                                flex: 1,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#bd1212'
                                            }]}
                                        onPress={() => excluirAtividade(atividadeSelecionada.id)}>
                                        <View style={{ flexDirection: "row", alignItems: 'center' }}>
                                            <MaterialIcons name="delete" size={20} color="#fff" />
                                            <Text style={{ color: "#fff" }}>Excluir</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* list atv */}
                    <View style={{ gap: 10 }}>
                        {(dadosOrganizados[diaSelecionado] || []).map((item, index) => (
                            <TouchableOpacity key={index} style={styles.cardAtividade} onPress={() => abrirSessao(item)}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ gap: 5 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons name='timer' size={20} color='#34445B' />
                                            <Text style={{ color: '#34445B', fontWeight: 'bold', fontSize: 16 }}>
                                                {item.nome}
                                            </Text>
                                        </View>
                                        <Text>{item.materia}</Text>
                                    </View>
                                    {
                                        item.tipoSessao === "pomodoro" ?
                                            <View>
                                                <View style={{ flexDirection: 'row', gap: 5 }}>
                                                    <View style={{ borderWidth: 1, borderColor: '#34445B', borderRadius: 10, padding: 3 }}>
                                                        <Text>Início:</Text>
                                                        <Text>{item.tempoInicio || item.data}</Text>
                                                    </View>
                                                    <View style={{ borderWidth: 1, borderColor: '#34445B', borderRadius: 10, padding: 3 }}>
                                                        <Text>Pomodoro</Text>
                                                        <Text style={{ textAlign: 'center' }}>
                                                            {item.numCiclos}x
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            :
                                            <View>
                                                <Text style={{ borderWidth: 1, borderColor: '#34445B', borderRadius: 10, padding: 3 }}>
                                                    {item.tempoInicio || item.data} - {item.tempoFim}
                                                </Text>
                                            </View>
                                    }
                                </View>

                                {
                                    item.tipoSessao === "pomodoro" ? (
                                        <View style={{ marginVertical: 10, flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                            <MaterialIcons name='timer' size={20} color='#34445B' />
                                            <Text>
                                                {item.tempoEstudo} min foco / {item.tempoPausa} min pausa |{" "}
                                                Duração total: {(item.numCiclos * (item.tempoEstudo + item.tempoPausa))} min
                                            </Text>
                                        </View>
                                    ) : null
                                }

                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                                    {/* btn editar */}
                                    <TouchableOpacity
                                        style={styles.buttonAction}
                                        onPress={() => abrirModalEditarAtividade(item)}
                                    >
                                        <Text>Editar</Text>
                                    </TouchableOpacity>

                                    {/* btn excluir */}
                                    <TouchableOpacity
                                        style={styles.buttonAction}
                                        onPress={() => abrirModalExcluirAtividade(item)}
                                    >
                                        <Text>Excluir</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
            <CustomToast />
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
    containerDias: {
        flexDirection: 'row',
    },
    diaSelecionado: {
        flex: 1,
        backgroundColor: "#34445B",
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10
    },
    diaNaoSelecionado: {
        flex: 1,
        borderWidth: 1,
        backgroundColor: "lightblue",
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10
    },
    cardAtividade: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 10,
        padding: 10
    },
    buttonAction: {
        borderWidth: 1,
        borderColor: '#34445B',
        borderRadius: 5,
        padding: 3
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
});
