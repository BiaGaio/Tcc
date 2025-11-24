import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { db } from "../../../firebaseConf";
import { collection, query, getDocs, where } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { useRouter } from 'expo-router';

export default function CardItemListAreaEConteudo({ title, numMaterias }) {
    const router = useRouter();
    const auth = getAuth();
    const [user, setUser] = useState(auth.currentUser);
    const [numConteudosEstudados, setNumConteudosEstudados] = useState(0);
    const [numConteudos, setNumConteudos] = useState(0);
    const [percent, setPercent] = useState(0);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (!user) return;
        
        const fetchConteudos = async () => {
            try {
                // obter areaRef
                const qArea = query(
                    collection(db, "areas"),
                    where("nome", "==", title),
                    where("user", "==", user.email)
                );

                const querySnapshotArea = await getDocs(qArea);

                if (querySnapshotArea.empty) {
                    console.warn("Área não encontrada:", title);
                    return null;
                }

                const areaRef = querySnapshotArea.docs[0].ref;

                // obter conteudos da area
                const q = query(
                    collection(db, "conteudos"),
                    where("area", "==", areaRef)
                );
                const querySnapshot = await getDocs(q);

                const totalConteudos = querySnapshot.size;
                let conteudosIniciados = 0;

                querySnapshot.forEach((doc) => {
                    const conteudoData = doc.data();
                    console.log('Conteúdo data:', conteudoData);

                    if (conteudoData.status === "iniciado") {
                        conteudosIniciados++;
                    }
                });

                console.log('chegou até aquii ---->>>>')

                setNumConteudos(totalConteudos);
                setNumConteudosEstudados(conteudosIniciados);

                // calcular porcentagem
                const porcentagem = totalConteudos > 0 ? (conteudosIniciados / totalConteudos) * 100 : 0;
                setPercent(porcentagem.toFixed(0));

                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar número de conteúdos:", error);
            }
        };

        fetchConteudos();
    }, [title, user]);

    return (
        <View style={styles.container}>
            <View style={styles.containerTitlePercent}>
                <View>
                    <Text>{title}</Text>
                    <Text>{numMaterias} {numMaterias === 1 ? "matéria" : "matérias"}</Text>
                </View>
                <Text style={styles.percent}>{percent}%</Text>
            </View>

            <View style={{
                borderWidth: 1,
                borderColor: '#34445B',
                borderRadius: 10,
                width: '100%',
            }}>
                {!loading &&
                    <View style={{
                        backgroundColor: '#34445B',
                        height: 10,
                        width: `${percent}%`,
                        borderRadius: 10
                    }}></View>
                }
            </View>

            <View>
                <Text>{numConteudosEstudados}/{numConteudos} conteúdos</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: '#34445B',
        padding: 10,
        gap: 5,
        borderRadius: 10
    },
    containerTitlePercent: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    title: {
        color: '#34445B',
    },
    percent: {
        borderWidth: 1,
        borderColor: '#34445B',
        height: 30,
        padding: 3,
        borderRadius: 10
    }
});
