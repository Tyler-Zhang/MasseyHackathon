package net.screenoff.screenoff;

import android.content.Context;
import android.support.v4.app.Fragment;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.firebase.client.DataSnapshot;
import com.firebase.client.Firebase;
import com.firebase.client.FirebaseError;
import com.firebase.client.ValueEventListener;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class MainFragment extends Fragment {

    SharedPreferences pref;
    public static final String mypreference = "pref";

    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.main_fragment,container,false);
        pref = getContext().getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        final TextView tvToday = (TextView) v.findViewById(R.id.mainTimeToday);

        Calendar cal = Calendar.getInstance();
        int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);
        String dayOfMonthStr = String.valueOf(dayOfMonth);
        int hourOfDay = cal.get(Calendar.HOUR_OF_DAY);
        String hourOfDayStr = String.valueOf(hourOfDay);

        return v;
    }

}
