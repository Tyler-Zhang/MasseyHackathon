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
        Firebase myFirebaseRef = new Firebase("https://project-3886157552181854094.firebaseio.com/");
        pref = getContext().getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        final TextView tvToday = (TextView) v.findViewById(R.id.mainTimeToday);

        Calendar cal = Calendar.getInstance();
        int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);
        String dayOfMonthStr = String.valueOf(dayOfMonth);
        int hourOfDay = cal.get(Calendar.HOUR_OF_DAY);
        String hourOfDayStr = String.valueOf(hourOfDay);

        myFirebaseRef.child(pref.getString("grID", "error") + "/user/" + pref.getInt("id", 0) + "/" + dayOfMonthStr + "/" + hourOfDayStr).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                int minutes = (int) snapshot.getValue();
                int hour = (minutes % 60) / 60;
                int min = minutes - (hour * 60);

                Date date = new Date(0, 0, 0, hour, min);
                DateFormat format = new SimpleDateFormat("HHmm");
                tvToday.setText(format.format(date));
            }
            @Override public void onCancelled(FirebaseError error) { }
        });

        return v;
    }

    //void getData()
}
