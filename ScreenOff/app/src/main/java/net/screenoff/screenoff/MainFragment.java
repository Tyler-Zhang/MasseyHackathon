package net.screenoff.screenoff;

import android.content.Context;
import android.content.Intent;
import android.support.v4.app.Fragment;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
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

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class MainFragment extends Fragment {

    SharedPreferences pref;
    public static final String mypreference = "pref";
    RequestQueue requestQueue;

    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.main_fragment,container,false);
        pref = getContext().getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        final TextView tvToday = (TextView) v.findViewById(R.id.sot_today);
        requestQueue = Volley.newRequestQueue(getActivity());

        String url ="http://tylerzhang.com/view";
        JSONObject json = new JSONObject();

        try {
            json.put("grID", pref.getString("grID", "error"));
            json.put("name", pref.getString("name", "error"));
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
                                // get time today
                            } else {
                                String error = (String) response.get("body");

                                tvToday.setText(error);
                                Log.e("ERROR", error);
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                }, new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        error.printStackTrace();
                    }
                });

        requestQueue.add(objRequest);

        return v;
    }

}
