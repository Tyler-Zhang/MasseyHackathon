package net.screenoff.screenoff;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class ScreenReceiver extends BroadcastReceiver {

    SharedPreferences pref;
    public static final String mypreference = "pref";

    @Override
    public void onReceive(Context context, Intent intent) {
        pref = context.getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        if (intent.getAction().equals(Intent.ACTION_SCREEN_ON)) {
            long startTimer = System.currentTimeMillis();
            pref.edit().putLong("start", startTimer).commit();
        } else if (intent.getAction().equals(Intent.ACTION_SCREEN_OFF)) {
            long endTimer = System.currentTimeMillis();
            long startTimer = pref.getLong("start", 0);

            long screenOnTime = endTimer - startTimer;
            pref.edit().putLong("screen_on_time", screenOnTime).commit();
        }
    }

}
