package net.screenoff.screenoff;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;

import org.json.JSONObject;

public class JoinActivity extends AppCompatActivity {

    SharedPreferences pref;
    public static final String mypreference = "pref";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_join);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        EditText etCode = (EditText) findViewById(R.id.joinCode);
        Button bJoin = (Button) findViewById(R.id.joinButton);

        bJoin.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                String url ="http://tylerzhang.com/joinroom";
                JSONObject json = new JSONObject();

                try {
                    json.put("grID", pref.getString("grID", "error"));
                } catch (Exception e) {
                    e.printStackTrace();
                }

                JsonObjectRequest jsObjRequest = new JsonObjectRequest
                        (Request.Method.POST, url, json, new Response.Listener<JSONObject>() {

                            @Override
                            public void onResponse(JSONObject response) {
                                try {
                                    int id = Integer.parseInt(response.get("id").toString());
                                    pref.edit().putInt("id", id).apply();
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        }, new Response.ErrorListener() {

                            @Override
                            public void onErrorResponse(VolleyError error) {

                            }
                        });

                MySingleton.getInstance(getApplicationContext()).addToRequestQueue(jsObjRequest);

                pref.edit().putBoolean("logged_in", true).apply();
                Intent intentCreate = new Intent(JoinActivity.this, MainActivity.class);
                startActivity(intentCreate);
            }
        });
    }
}
