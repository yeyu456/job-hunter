package com.yeyu.jobhunter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

/**<p>类描述：类</p>
 * <pre>
 * 改动说明：
 *      【修改人：叶子璀 / 2016年6月10日 下午4:36:01 / 版本：1.0】
 * 
 * </pre>
 * @author 叶子璀
 * @version 1.0
 * @since 2016年6月10日 下午4:36:01
 */
@SpringApplicationConfiguration
@ComponentScan("com.yeyu.jobhunter")
public class BaseApplication {

    @Bean
    public Object getCrawler() {
        return null;
    }

    @Bean
    public Object getAnalyzer() {
        return null;
    }

    public static void main(String[] args) {
        SpringApplication.run(BaseApplication.class, args);
    }

}
