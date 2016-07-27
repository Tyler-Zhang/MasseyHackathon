package net.screenoff.screenoff;

import android.content.Context;
import android.support.v4.app.Fragment;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

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

    TextView tvToday;

    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.main_fragment,container,false);
        pref = getContext().getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        tvToday = (TextView) v.findViewById(R.id.sot_today);

        int todayTotal = pref.getInt("today_total", 0);

        Calendar sot = Calendar.getInstance();
        sot.set(Calendar.HOUR_OF_DAY, todayTotal / 60);
        sot.set(Calendar.MINUTE, todayTotal % 60);

        Date date = sot.getTime();
        tvToday.setText(new SimpleDateFormat("HH:mm").format(date));

        return v;
    }

}
