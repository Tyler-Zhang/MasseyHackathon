package net.screenoff.screenoff;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class RegisterActivity extends AppCompatActivity {

    SharedPreferences pref;
    public static final String mypreference = "pref";
    public static TextView tvCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        Button bContinue = (Button) findViewById(R.id.registerButton);
        tvCode = (TextView) findViewById(R.id.registerCode);

        //tvCode.setText(pref.getString("grID", "error"));

        bContinue.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                pref.edit().putBoolean("logged_in", true).apply();
                Intent intentContinue = new Intent(RegisterActivity.this, MainActivity.class);
                startActivity(intentContinue);
            }
        });
    }
}
