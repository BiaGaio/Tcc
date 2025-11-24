import { View, StyleSheet, Text } from "react-native";
import Toast from "react-native-toast-message";

function CustomToast({ ...rest }) {
    const toastConfig = {
        sucesso: ({ text1, text2 }) => (
            <View style={styles.sucesso}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
                {text2 && <Text style={{ color: 'white' }}>{text2}</Text>}
            </View>
        ),
        info: ({ text1, text2 }) => (
            <View style={styles.info}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
                {text2 && <Text style={{ color: 'white' }}>{text2}</Text>}
            </View>
        ),
        erro: ({ text1, text2 }) => (
            <View style={styles.erro}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
                {text2 && <Text style={{ color: 'white' }}>{text2}</Text>}
            </View>
        ),
    };

    return (
        <Toast {...rest} config={toastConfig} />
    )
}

const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2, position: 'bottom' })
};

const styles = StyleSheet.create({
    sucesso: {
        height: 60,
        width: '90%',
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'center',
        marginBottom: 20
    },
    erro: {
        height: 60,
        width: '90%',
        backgroundColor: '#E53935',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'center',
        marginBottom: 20
    },
    info: {
        height: 60,
        width: '90%',
        backgroundColor: '#35a1e5',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'center',
        marginBottom: 20
    }
});

export { CustomToast, showToast };

