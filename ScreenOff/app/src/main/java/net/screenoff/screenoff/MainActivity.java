package net.screenoff.screenoff;

import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.support.design.widget.NavigationView;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {

    SharedPreferences pref;
    public static final String mypreference = "pref";
    private final static String STORETEXT = "timedata.txt";

    private DrawerLayout mDrawer;
    private Toolbar toolbar;
    private NavigationView nvDrawer;
    private ActionBarDrawerToggle drawerToggle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // set up toolbar
        toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        // set up drawer
        mDrawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        nvDrawer = (NavigationView) findViewById(R.id.nav_view);
        setupDrawerContent(nvDrawer);
        drawerToggle = setupDrawerToggle();

        // test for internet
        internetTest();
    }

    private void mainTask() {
        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        if (!pref.getBoolean("logged_in", false)) {
            loadLoginView();
        } else {
            Intent i = new Intent(this, ScreenService.class);
            startService(i);

            syncFiles();

            Fragment fragment = null;

            try {
                fragment = (Fragment) MainFragment.class.newInstance();
            } catch (Exception e) {
                e.printStackTrace();
            }

            FragmentManager fragmentManager = getSupportFragmentManager();
            fragmentManager.beginTransaction().replace(R.id.frame, fragment).commit();
        }
    }

    private void syncFiles () {
        pref = getSharedPreferences(mypreference, Context.MODE_PRIVATE);

        try {
            InputStream inputStream = openFileInput(STORETEXT);

            if ( inputStream != null ) {
                InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
                BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
                String[] temp = bufferedReader.readLine().split("=");

                for (int i = 0; i < temp.length; i++) {
                    String[] temp2 = temp[i].split(" ");

                    String url ="http://tylerzhang.com/createroom";
                    JSONObject json = new JSONObject();

                    try {
                        json.put("grID", pref.getString("grID", "error"));
                        json.put("id", pref.getInt("id", 0));
                        json.put("time", Long.parseLong(temp2[1]));
                        json.put("milli", Long.parseLong(temp2[0]));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    JsonObjectRequest jsObjRequest = new JsonObjectRequest
                            (Request.Method.POST, url, json, new Response.Listener<JSONObject>() {

                                @Override
                                public void onResponse(JSONObject response) {
                                    try {

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
                }

                File dir = getFilesDir();
                File file = new File(dir, STORETEXT);
                boolean deleted = file.delete();
                inputStream.close();
                inputStreamReader.close();
            }
        }
        catch (Exception e) {
            e.printStackTrace();
        }

    }

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

    private void internetTest () {
        if(checkConnectivity()) {
            mainTask();
        } else {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("No Internet Connection");
            builder.setMessage("This app requires an Internet connection to run.");

            builder.setPositiveButton("Retry", new DialogInterface.OnClickListener()
            {
                @Override
                public void onClick(DialogInterface dialog, int which)
                {
                    dialog.dismiss();
                    internetTest();
                }
            });

            AlertDialog dialog = builder.create();
            dialog.show();
            Toast.makeText(this, "Network Unavailable!", Toast.LENGTH_LONG).show();
        }
    }


    private void loadLoginView() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    private void setupDrawerContent(NavigationView navigationView) {
        navigationView.setNavigationItemSelectedListener(
                new NavigationView.OnNavigationItemSelectedListener() {
                    @Override
                    public boolean onNavigationItemSelected(MenuItem menuItem) {
                        selectDrawerItem(menuItem);
                        return true;
                    }
                });
    }

    public void selectDrawerItem(MenuItem menuItem) {
        Fragment fragment = null;
        Class fragmentClass = null;

        switch(menuItem.getItemId()) {
            case R.id.nav_home:
                fragmentClass = MainFragment.class;
                Log.d("MAINFRAGMENT", "yay");
                break;
            case R.id.nav_room:

                break;
            case R.id.nav_info:

                break;
            case R.id.nav_pref:

                break;
            case R.id.nav_switch:
                fragmentClass = SwitchFragment.class;
                Log.d("SWITCHFRAGMENT", "yay");
                break;
            default:
                fragmentClass = MainFragment.class;
        }

        try {
            fragment = (Fragment) fragmentClass.newInstance();
        } catch (Exception e) {
            e.printStackTrace();
        }

        FragmentManager fragmentManager = getSupportFragmentManager();
        fragmentManager.beginTransaction().replace(R.id.frame, fragment).commit();

        menuItem.setChecked(true);
        setTitle(menuItem.getTitle());
        mDrawer.closeDrawers();
    }

    public boolean onOptionsItemSelected(MenuItem item) {
        if (drawerToggle.onOptionsItemSelected(item)) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        drawerToggle.syncState();
    }

    private ActionBarDrawerToggle setupDrawerToggle() {
        return new ActionBarDrawerToggle(this, mDrawer, toolbar, R.string.drawer_open,  R.string.drawer_close);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        drawerToggle.onConfigurationChanged(newConfig);
    }

}
