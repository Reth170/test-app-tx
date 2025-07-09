import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SignIn from './SignIn';
import App from '../App';
import TimeCard from '../TimeCard';
import Contact from '../Contact';
import LoginPage from '../LoginPage';
import Employee from '../Employee';

export default function AppRouter() {

    function requireAuth(nextState, replace, next) {
        if (true) {
          replace({
            pathname: "/login",
            state: {nextPathname: nextState.location.pathname}
          });
        }
        next();
      }

    return(
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} >
                    </Route>
                    <Route path="/home" element={<App />} onEnter={requireAuth} >
                    </Route>
                    <Route path="/time" element={<TimeCard />} onEnter={requireAuth} >
                    </Route>
                    <Route path="/contact" element={<Contact />} onEnter={requireAuth} >
                    </Route>
                    <Route path="/employee" element={<Employee />} onEnter={requireAuth} >
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}