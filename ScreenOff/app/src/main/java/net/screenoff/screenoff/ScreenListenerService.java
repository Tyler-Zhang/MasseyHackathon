package net.screenoff.screenoff;

import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.IBinder;
import android.util.Log;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Date;

public class ScreenListenerService extends Service {

    static SharedPreferences pref;
    public static final String preference = "pref";
    private final static String TIMEDATA = "timedata.txt";

    // create broadcast receiver to track screen on/off
    private BroadcastReceiver ScreenReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals(Intent.ACTION_SCREEN_ON)) {
                long startTimer = System.currentTimeMillis();
                // need to use shared preferences to store start timer even when service restarts
                pref.edit().putLong("start_timer", startTimer).apply();
                Log.d("ScreenListenerService", "screen on at " + startTimer);
            } else if (intent.getAction().equals(Intent.ACTION_SCREEN_OFF)) {
                writeScreenTimeToFile(context);
            }
        }
    };

    @Override
    public void onDestroy() {
        unregisterReceiver(ScreenReceiver);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // register broadcast receiver & set up shared preferences
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(Intent.ACTION_SCREEN_ON);
        intentFilter.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(ScreenReceiver, intentFilter);
        pref = getSharedPreferences(preference, Context.MODE_PRIVATE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        writeScreenTimeToFile(this);

        // set start timer
        long startTimer = System.currentTimeMillis();
        pref.edit().putLong("start_timer", startTimer).apply();

        // restart service if killed
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // calculate screen on time & store in file
    static void writeScreenTimeToFile(Context context) {
        long endTimer = System.currentTimeMillis();
        long startTimer = pref.getLong("start_timer", System.currentTimeMillis());
        long screenOnTime = endTimer - startTimer;
        Log.d("ScreenListenerService", "screen off at " + endTimer);
        Log.d("ScreenListenerService", "screen on time is " + screenOnTime);

        if (screenOnTime >= 10) {
            InputStream inputStream;
            String contents = "";
            InputStreamReader inputStreamReader;

            // get previous content of line
            try {
                inputStream = context.openFileInput(TIMEDATA);

                if (inputStream != null) {
                    inputStreamReader = new InputStreamReader(inputStream);
                    BufferedReader fileReader = new BufferedReader(inputStreamReader);
                    contents = fileReader.readLine();
                    Log.d("ScreenListenerService", "line before update is " + contents);
                    inputStream.close();
                }
            } catch (FileNotFoundException e) {
                // file not created yet, ignore
            } catch (IOException e) {
                e.printStackTrace();
            }

            // write line
            try {
                OutputStreamWriter fileWriter = new OutputStreamWriter(context.openFileOutput(TIMEDATA, Context.MODE_PRIVATE));
                fileWriter.write(contents + "=" + screenOnTime + " " + endTimer);
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

}
