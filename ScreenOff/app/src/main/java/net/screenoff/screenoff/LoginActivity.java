package net.screenoff.screenoff;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {

    RequestQueue queue;
    SharedPreferences pref;
    public static final String mypreference = "pref";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        queue = Volley.newRequestQueue(this);

        Button bJoin = (Button) findViewById(R.id.loginJoin);
        Button bCreate = (Button) findViewById(R.id.loginCreate);
        final EditText etName = (EditText) findViewById(R.id.loginName);

        bJoin.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentJoin = new Intent(LoginActivity.this, JoinActivity.class);
                startActivity(intentJoin);
            }
        });

        bCreate.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                String url ="http://tylerzhang.com/createroom";
                JSONObject json = new JSONObject();

                try {
                    json.put("type", "android");
                    json.put("name", etName.getText().toString());
                } catch (Exception e) {
                    e.printStackTrace();
                }

                JsonObjectRequest jsObjRequest = new JsonObjectRequest
                        (Request.Method.POST, url, json, new Response.Listener<JSONObject>() {

                            @Override
                            public void onResponse(JSONObject response) {
                                try {
                                    String grID = (String)response.get("grID");
                                    int id = Integer.parseInt(response.get("id").toString());
                                    pref.edit().putString("grID", grID).commit();
                                    pref.edit().putInt("id", id).commit();
                                    RegisterActivity.tvCode.setText(grID);
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

                Intent intentCreate = new Intent(LoginActivity.this, RegisterActivity.class);
                startActivity(intentCreate);
            }
        });
    }

}
