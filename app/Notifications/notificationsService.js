import * as Notifications from 'expo-notifications';

// Handler GLOBAL — deve ficar fora de qualquer componente
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,  // mostra o pop-up
        shouldShowList: true,   // coloca na central de notificações
        shouldPlaySound: true, // toca o som da notificação ao chegar
        shouldSetBadge: true, // atualiza o número exibido no ícone do app
    }),
});

// Pedir permissão -> rever
export async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

// Notificação imediata
export async function scheduleImmediately(title, body, data = {}) {
    return await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null, // dispara na hora
    });
}

// Notificação diária
export async function scheduleDaily(hour, minute, title, body, data = {}) {
    return await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: {
            hour,
            minute,
            repeats: true,
        },
    });
}

// Cancelar todas as notificações agendadas
export async function clearAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Notificações canceladas.");
}
