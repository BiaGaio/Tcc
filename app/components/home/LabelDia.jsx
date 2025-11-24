import { Text } from "react-native";

export default function LabelDia({ data }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // zera horas para comparar só a data

    // garante que atividadeData seja Date válido
    const atividadeData = data instanceof Date ? data : data.toDate?.() ?? new Date(data);
    atividadeData.setHours(0, 0, 0, 0);

    const diffDias = Math.floor((atividadeData - hoje) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
        return (
            <Text
                style={{
                    backgroundColor: '#34445B',
                    color: 'lightblue',
                    padding: 3,
                    borderRadius: 15,
                    width: 80,
                    textAlign: 'center',
                }}
            >
                Hoje
            </Text>
        );
    } else if (diffDias === 1) {
        return (
            <Text
                style={{
                    borderWidth: 1,
                    borderColor: '#34445B',
                    color: '#34445B',
                    padding: 3,
                    borderRadius: 15,
                    width: 100,
                    textAlign: 'center'
                }}
            >
                Amanhã
            </Text>
        );
    } else if (diffDias > 1) {
        return (
            <Text
                style={{
                    borderWidth: 1,
                    borderColor: '#34445B',
                    color: '#34445B',
                    padding: 3,
                    borderRadius: 15,
                    width: 100,
                    textAlign: 'center'
                }}
            >
                Em {diffDias} dias
            </Text>
        );
    } else {
        // atividade no passado
        // return (
        //     <Text
        //         style={{
        //             borderWidth: 1,
        //             borderColor: '#B33434',
        //             color: '#B33434',
        //             padding: 3,
        //             borderRadius: 15,
        //             width: 100,
        //             textAlign: 'center'
        //         }}
        //     >
        //         Passado
        //     </Text>
        // );
    }
}
