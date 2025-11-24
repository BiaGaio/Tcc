import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { requestPermissions, scheduleDaily } from "./Notifications/notificationsService";
import { Redirect } from "expo-router";

export default function Index() {

    useEffect(() => {
        async function initNotifications() {
            const granted = await requestPermissions();
            if (!granted) return;

            await Notifications.cancelAllScheduledNotificationsAsync();


            const HOUR_SCHEDULE = 8;
            const MINUTE_SCHEDULE = 0;

            await scheduleDaily(
                HOUR_SCHEDULE,
                MINUTE_SCHEDULE,
                `[${HOUR_SCHEDULE}:${MINUTE_SCHEDULE}]: Hora de estudar! 📚🔥`,
                "Não esqueça de manter seu streak hoje!"
            );
        }

        console.log("⏰ Notificação diária das 8h agendada.");

        initNotifications();
    }, []);

    // redireciona para login ou home, como quiser
    return <Redirect href="/(auth)" />;
}
