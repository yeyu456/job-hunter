package com.yeyu.jobhunter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 
 * Running the crawler and analyzer
 * @author yeyu456
 * @since v0.0.1
 */
@Component
public class Runner implements ApplicationRunner {

    @Autowired
    private Object crawler;

    @Autowired
    private Object analyzer;

    @Override
    public void run(ApplicationArguments arg0) throws Exception {
        // TODO
    }

}
