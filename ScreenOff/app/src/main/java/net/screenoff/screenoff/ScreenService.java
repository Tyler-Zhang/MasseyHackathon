package net.screenoff.screenoff;

import android.app.IntentService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Date;

public class ScreenService extends IntentService {

    private final static String TIMEDATA = "timedata.txt";
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
            Log.d("ScreenService", "screen off");
            Log.d("ScreenService", "screen on time is " + screenOnTime);

            //file = new File(context.getFilesDir(), TIMEDATA);

            /*try {
                if (!file.exists())
                    file.createNewFile();
            } catch (Exception e) {
                e.printStackTrace();
            }*/

            InputStream inputStream;
            String contents = "";
            InputStreamReader inputStreamReader;

            try {
                inputStream = openFileInput(TIMEDATA);

                if (inputStream != null) {
                    inputStreamReader = new InputStreamReader(inputStream);
                    BufferedReader fileReader = new BufferedReader(inputStreamReader);

                    String line = fileReader.readLine();
                    Log.d("ScreenService", "line is " + line);
                    contents = line;

                    inputStream.close();
                }
            } catch (FileNotFoundException e) {
                // file not created yet, ignore
            } catch (IOException e) {
                e.printStackTrace();
            }

            try {
                OutputStreamWriter fileWriter = new OutputStreamWriter(openFileOutput(TIMEDATA, Context.MODE_PRIVATE));
                fileWriter.write(contents + "=" + screenOnTime + " " + new Date().getTime());
                fileWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    };

    private BroadcastReceiver screenOn = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            startTimer = System.currentTimeMillis();
            Log.d("ScreenService", "screen on");
        }
    };
}
