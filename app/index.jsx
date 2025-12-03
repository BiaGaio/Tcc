import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { requestPermissions, scheduleDaily } from "./Notifications/notificationsService";
import { Redirect } from "expo-router";

export default function Index() {

    // IDs para notificações de estudo
    const ESTUDOS_IDS = [
        "estudo_8h",
        "estudo_14h",
        "estudo_20h"
    ];

    // cancelar SOMENTE notificações do estudo
    const cancelarNotificacoesEstudo = async () => {
        for (const id of ESTUDOS_IDS) {
            try {
                await Notifications.cancelScheduledNotificationAsync(id);
                console.log("Cancelada:", id);
            } catch (e) {
                // Se não existir, ignore
            }
        }
    };

    useEffect(() => {
        async function initNotifications() {
            const granted = await requestPermissions();
            if (!granted) return;

            await cancelarNotificacoesEstudo();

            const HORARIOS_ESTUDO = [
                { id: "estudo_8h",  h: 8,  m: 0, title: "Bom dia! ⏰📚", body: "Comece o dia estudando!" },
                { id: "estudo_14h", h: 14, m: 0, title: "Hora de revisar! 🔄", body: "Um pouquinho de estudo faz diferença!" },
                { id: "estudo_20h", h: 20, m: 0, title: "Fechando o dia! 🌙🔥", body: "Seu streak está chamando!" }
            ];

            // agendar novamente cada um
            for (const horario of HORARIOS_ESTUDO) {
                await scheduleDaily(
                    horario.h,
                    horario.m,
                    horario.title,
                    horario.body,
                    horario.id // garante que cada uma tem ID único
                );

                console.log(`⏰ Notificação agendada: ${horario.id}`);
            }
        }

        initNotifications();
    }, []);

    // redireciona para login ou home, como quiser
    return <Redirect href="/(auth)" />;
}

