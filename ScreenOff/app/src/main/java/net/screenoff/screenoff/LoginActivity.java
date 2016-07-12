package net.screenoff.screenoff;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {

    RequestQueue requestQueue;
    EditText etName;
    SharedPreferences pref;
    public static final String mypreference = "pref";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);
        requestQueue = Volley.newRequestQueue(this);

        // find layout elements
        Button bJoin = (Button) findViewById(R.id.loginJoin);
        Button bCreate = (Button) findViewById(R.id.loginCreate);
        etName = (EditText) findViewById(R.id.loginName);
        pref.edit().putString("name", etName.getText().toString()).apply();

        // join existing room
        bJoin.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentJoin = new Intent(LoginActivity.this, JoinActivity.class);
                startActivity(intentJoin);
            }
        });

        // create new room
        bCreate.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                internetTest();
            }
        });
    }

    // creates room if internet connection is found
    private void createRoom() {
        String url = "http://tylerzhang.com/createroom";
        JSONObject json = new JSONObject();

        try {
            json.put("type", "android");
            json.put("name", etName.getText().toString());
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
                                JSONObject body = response.getJSONObject("body");
                                String grID = (String) body.get("grID");
                                int id = Integer.parseInt(body.get("id").toString());
                                pref.edit().putString("grID", grID).apply();
                                pref.edit().putInt("id", id).apply();
                                RegisterActivity.tvCode.setText(grID);
                            } else {
                                String error = (String) response.get("body");
                                Log.d("ERROR", error);
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                }, new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Log.e("Volley", "Error");
                    }
                });

        requestQueue.add(objRequest);

        Intent intentCreate = new Intent(LoginActivity.this, RegisterActivity.class);
        startActivity(intentCreate);
    }

    // checks for internet
    private boolean checkConnectivity() {
        boolean connected = false;
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_MOBILE).getState() == NetworkInfo.State.CONNECTED ||
                connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI).getState() == NetworkInfo.State.CONNECTED) {
            connected = true;
        } else
            connected = false;

        return connected;
    }

    // displays error if not connected to internet
    private void internetTest() {
        if (checkConnectivity()) {
            createRoom();
        } else {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("No Internet Connection");
            builder.setMessage("Joining a room requires an internet connection");

            builder.setPositiveButton("Retry", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.dismiss();
                    internetTest();
                }
            });

            AlertDialog dialog = builder.create();
            dialog.show();
            Toast.makeText(this, "Network Unavailable", Toast.LENGTH_LONG).show();
        }
    }

}
