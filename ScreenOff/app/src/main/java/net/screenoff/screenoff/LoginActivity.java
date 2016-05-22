package net.screenoff.screenoff;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        Button bJoin = (Button) findViewById(R.id.loginJoin);
        Button bCreate = (Button) findViewById(R.id.loginCreate);
        EditText etName = (EditText) findViewById(R.id.loginName);

        bJoin.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentJoin = new Intent(LoginActivity.this, JoinActivity.class);
                startActivity(intentJoin);
            }
        });

        bCreate.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent intentCreate = new Intent(LoginActivity.this, RegisterActivity.class);
                startActivity(intentCreate);
            }
        });
    }
}
