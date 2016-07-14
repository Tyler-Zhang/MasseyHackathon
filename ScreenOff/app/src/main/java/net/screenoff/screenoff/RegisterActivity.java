package net.screenoff.screenoff;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class RegisterActivity extends AppCompatActivity {

    public static TextView tvCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        Button bContinue = (Button) findViewById(R.id.registerButton);
        tvCode = (TextView) findViewById(R.id.registerCode);
        String grID = getIntent().getStringExtra("grID");
        tvCode.setText(grID);

        bContinue.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentContinue = new Intent(RegisterActivity.this, MainActivity.class);
                startActivity(intentContinue);
            }
        });
    }

    // disable back button
    @Override
    public void onBackPressed() {
    }
}
