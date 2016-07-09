package net.screenoff.screenoff;

import android.app.IntentService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Date;

public class ScreenService extends IntentService {

    private final static String STORETEXT = "timedata.txt";
    File file;
    OutputStreamWriter out;

    static long startTimer = System.currentTimeMillis();

    public ScreenService() {
        super(ScreenService.class.getName());
    }

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    protected void onHandleIntent(Intent workIntent) {
        registerReceiver(screenOff, new IntentFilter(Intent.ACTION_SCREEN_OFF));
        registerReceiver(screenOn, new IntentFilter(Intent.ACTION_SCREEN_ON));

        while (true) {
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        super.onStartCommand(intent, flags, startId);
        return START_STICKY;
    }

    public void onDelete() {
        unregisterReceiver(screenOff);
        unregisterReceiver(screenOn);
    }

    private BroadcastReceiver screenOff = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long endTimer = System.currentTimeMillis();
            long screenOnTime = endTimer - startTimer;

            file = new File(context.getFilesDir(), STORETEXT);

            try {
                if (!file.exists())
                    file.createNewFile();
            }catch (Exception e) {
                e.printStackTrace();
            }

            InputStream inputStream;
            String contents = "";
            InputStreamReader inputStreamReader;

            try {
                inputStream = openFileInput(STORETEXT);
                inputStreamReader = new InputStreamReader(inputStream);

                BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
                contents = bufferedReader.readLine();
                inputStream.close();
            }catch (Exception e) {
                e.printStackTrace();
            }

            try {
                out = new OutputStreamWriter(openFileOutput(STORETEXT, Context.MODE_PRIVATE));
                out.write(contents + "=" + screenOnTime + " " + new Date().getTime());
                out.close();
            }catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    private BroadcastReceiver screenOn = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            startTimer = System.currentTimeMillis();
        }
    };
}
