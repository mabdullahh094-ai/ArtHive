import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";

// Test components
const Home = () => <h1>Home</h1>;
const ArtistsList = () => <h1>ARTISTS TEST - SHOULD WORK</h1>;

function TestApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="artists" element={<ArtistsList />} />
      </Route>
    </Routes>
  );
}

export default TestApp;
