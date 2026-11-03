// @ts-check
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
  analyzerMode: 'static',
  reportFilename: './apps/admin/.next/analyze/report.html',
});

module.exports = withBundleAnalyzer;
