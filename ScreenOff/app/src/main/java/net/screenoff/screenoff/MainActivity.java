package net.screenoff.screenoff;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.Bundle;
import android.support.design.widget.NavigationView;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;

public class MainActivity extends AppCompatActivity {

    SharedPreferences pref;
    public static final String preference = "pref";

    private DrawerLayout mDrawer;
    private Toolbar toolbar;
    private NavigationView nvDrawer;
    private ActionBarDrawerToggle drawerToggle;

    private boolean isError;

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

        // get shared preferences
        pref = getSharedPreferences(preference, Context.MODE_PRIVATE);

        // set up header text
        View headerView = nvDrawer.getHeaderView(0);
        TextView tvHeader = (TextView) headerView.findViewById(R.id.header_text);
        tvHeader.setText("Room code: " + pref.getString("grID", "error"));

        // check if user already joined a group
        if (!pref.getBoolean("logged_in", false)) {
            loadLoginActivity();
        } else {
            // start screen service
            Log.d("MainActivity", "service started");
            Intent intent = new Intent(this, ScreenListenerService.class);
            startService(intent);

            // set main fragment
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

    // load login activity
    private void loadLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    // set up navigation drawer
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

        switch (menuItem.getItemId()) {
            case R.id.nav_home:
                fragmentClass = MainFragment.class;
                break;
            case R.id.nav_room:

                break;
            case R.id.nav_info:

                break;
            case R.id.nav_pref:

                break;
            case R.id.nav_switch:
                pref.edit().remove("grID").apply();
                pref.edit().remove("id").apply();
                Intent i = new Intent(MainActivity.this, LoginActivity.class);
                startActivity(i);
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
        return new ActionBarDrawerToggle(this, mDrawer, toolbar, R.string.drawer_open, R.string.drawer_close);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        drawerToggle.onConfigurationChanged(newConfig);
    }

    // disable back button
    @Override
    public void onBackPressed() {
    }

}
