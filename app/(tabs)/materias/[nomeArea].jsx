import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image } from "react-native";
import { db } from "../../../firebaseConf";
import { collection, query, where, getDocs } from "firebase/firestore";
import CardMateriaConteudo from "../../components/materias/CardMateriaConteudo";
import { getAuth } from "firebase/auth";
import { showToast, CustomToast } from "../../components/CustomToast";

export default function NomeArea() {
    const router = useRouter();
    const auth = getAuth();
    const { nomeArea } = useLocalSearchParams();

    const [conteudosPorMateria, setConteudosPorMateria] = useState({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(auth.currentUser);
    const [listMaterias, setListMaterias] = useState([]);

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

    // função auxiliar para obter a área
    const getAreaRef = async (nomeArea, user) => {
        const q = query(
            collection(db, "areas"),
            where("nome", "==", nomeArea),
            where("user", "==", user.email)
        );

        const snap = await getDocs(q);
        return snap.docs[0]?.ref || null;
    };

    // buscar materias da área
    const fetchMaterias = async () => {
        try {
            const areaRef = await getAreaRef(nomeArea, user);
            if (!areaRef) {
                console.warn("Área não encontrada:", nomeArea);
                return;
            }

            const qMaterias = query(
                collection(db, "materias"),
                where("area", "==", areaRef)
            );

            const snap = await getDocs(qMaterias);

            const listMateriasFB = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log("Matérias buscadas:", listMateriasFB);
            setListMaterias(listMateriasFB);

        } catch (error) {
            console.error("Erro ao buscar matérias:", error);
        }
    };

    // buscar conteudos agrupados por matéria
    const fetchConteudos = async () => {
        try {
            setLoading(true);

            const areaRef = await getAreaRef(nomeArea, user);
            if (!areaRef) {
                console.warn("Área não encontrada:", nomeArea);
                return;
            }

            const qMaterias = query(
                collection(db, "materias"),
                where("area", "==", areaRef)
            );

            const materiasSnap = await getDocs(qMaterias);
            const conteudosAgrupados = {};

            for (const materiaDoc of materiasSnap.docs) {
                const materiaNome = materiaDoc.data().nome;
                const materiaRef = materiaDoc.ref;

                const qConteudos = query(
                    collection(db, "conteudos"),
                    where("area", "==", areaRef),
                    where("materia", "==", materiaRef)
                );

                const conteudosSnap = await getDocs(qConteudos);

                conteudosAgrupados[materiaNome] = conteudosSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
            }

            setConteudosPorMateria(conteudosAgrupados);

        } catch (error) {
            console.error("Erro ao buscar conteúdos:", error);
        } finally {
            setLoading(false);
        }
    };

    // chamando a função no useEffect
    useEffect(() => {
        if (!user) return;
        fetchMaterias();
    }, [user]);

    useEffect(() => {
        if (!user || !nomeArea) return;
        fetchConteudos();
    }, [user, nomeArea, listMaterias]);
    


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "lightblue" }}>
            <ScrollView>
                <View style={styles.container}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => router.replace("/materias")}>
                            <MaterialIcons name="chevron-left" size={40} color="#34445B" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, alignItems: "center", marginRight: 40 }}>
                            <Text style={styles.title}>{nomeArea}</Text>
                        </View>
                    </View>

                    <View style={{ gap: 10, marginTop: 10 }}>
                        {loading ? (
                            <Image
                                source={require("../../../assets/loading.gif")}
                                style={{ width: 40, height: 40, alignSelf: "center" }}
                            />
                        ) : listMaterias.length === 0 ? (
                            <Text style={{ textAlign: "center", color: "#34445B" }}>
                                Nenhuma matéria encontrada.
                            </Text>
                        ) : (
                            listMaterias.map((materia, index) => (
                                <CardMateriaConteudo
                                    key={`id__${materia?.nome}-${index}`}
                                    title={materia?.nome}
                                    conteudos={conteudosPorMateria[materia?.nome] || []}
                                    listMaterias={listMaterias}
                                    setListMaterias={setListMaterias}
                                    setConteudos={fetchConteudos}
                                    showToast={showToast}
                                />
                            ))
                        )}
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
        fontSize: 22,
        fontWeight: "bold",
        textTransform: "capitalize",
    },
});
