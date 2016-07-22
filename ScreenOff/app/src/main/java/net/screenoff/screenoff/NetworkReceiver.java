package net.screenoff.screenoff;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class NetworkReceiver extends BroadcastReceiver {

    private boolean isError;
    private final static String STORETEXT = "timedata.txt";

    SharedPreferences pref;
    public static final String mypreference = "pref";
    RequestQueue requestQueue;

    @Override
    public void onReceive(Context context, Intent intent) {
        pref = context.getSharedPreferences(mypreference, Context.MODE_PRIVATE);
        requestQueue = Volley.newRequestQueue(context);

        if (isOnline(context)) {
            Toast.makeText(context, "Internet connected", Toast.LENGTH_LONG).show();
            syncFiles(context);
        } else {
            Toast.makeText(context, "Internet disconnected", Toast.LENGTH_LONG).show();
        }
    }

    // check if phone is online
    private boolean isOnline(Context context) {
        ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo netInfo = connectivityManager.getActiveNetworkInfo();
        return (netInfo != null && netInfo.isConnected());
    }

    // sync screen data
    private void syncFiles (Context context) {
        try {
            InputStream inputStream = context.openFileInput(STORETEXT);
            isError = false;

            if (inputStream != null) {
                InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
                BufferedReader fileReader = new BufferedReader(inputStreamReader);

                String temp = fileReader.readLine();
                Log.d("MainActivity", "line is " + temp);
                String line = temp.substring(1);
                String[] entry = line.split("=");

                for (int i = 0; i < entry.length; i++) {
                    String[] data = entry[i].split(" ");

                    String url = "http://tylerzhang.com/report";
                    JSONObject json = new JSONObject();

                    try {
                        json.put("grID", pref.getString("grID", "error"));
                        json.put("id", pref.getInt("id", -1));
                        json.put("milli", Long.parseLong(data[0]));
                        json.put("time", Long.parseLong(data[1]));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    JsonObjectRequest objRequest = new JsonObjectRequest
                            (Request.Method.POST, url, json, new Response.Listener<JSONObject>() {
                                @Override
                                public void onResponse(JSONObject response) {
                                    try {
                                        String type = (String) response.get("type");

                                        if (type.equals("SUCCESS")) {
                                            Log.d("syncFiles", (String) response.get("body"));
                                        } else {
                                            Log.d("syncFiles", (String) response.get("body"));
                                        }
                                    } catch (JSONException e) {
                                        e.printStackTrace();
                                    }
                                }
                            }, new Response.ErrorListener() {
                                @Override
                                public void onErrorResponse(VolleyError error) {
                                    error.printStackTrace();
                                    isError = true;
                                }
                            });

                    requestQueue.add(objRequest);
                }

                // close input stream
                inputStream.close();
            }

            // delete file
            if (!isError) {
                File dir = context.getFilesDir();
                File file = new File(dir, STORETEXT);
                boolean deleted = file.delete();
            }
        } catch (FileNotFoundException e) {
            // file not created yet, ignore
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
}
