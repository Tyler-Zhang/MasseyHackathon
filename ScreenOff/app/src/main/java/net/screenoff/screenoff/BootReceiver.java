package net.screenoff.screenoff;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {

    SharedPreferences pref;
    public static final String preference = "pref";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        pref = context.getSharedPreferences(preference, Context.MODE_PRIVATE);

        if (action.equals(Intent.ACTION_BOOT_COMPLETED) || action.equals("android.intent.action.QUICKBOOT_POWERON")) {
            Intent service = new Intent(context, ScreenListenerService.class);
            context.startService(service);
        } else if (action.equals(Intent.ACTION_SHUTDOWN) || action.equals("android.intent.action.QUICKBOOT_POWEROFF")) {
            Log.d("BootReceiver", "shutting down...");
            ScreenListenerService.writeScreenTimeToFile(context);
            pref.edit().remove("start_timer").apply();
        }
    }

}
