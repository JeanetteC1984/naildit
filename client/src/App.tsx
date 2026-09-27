import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import { PrivacyPolicy, ReturnsPolicy, ShippingPolicy } from "./pages/Policy";

export default function App() {
  return <Switch>
    <Route path="/shipping" component={ShippingPolicy} />
    <Route path="/returns" component={ReturnsPolicy} />
    <Route path="/privacy" component={PrivacyPolicy} />
    <Route component={Home} />
  </Switch>;
}
